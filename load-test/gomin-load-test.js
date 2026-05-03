/**
 * Gomin — k6 load test
 *
 * Simulates realistic frontend behavior:
 *   setup()    → register N users, create a shared GROUP chat
 *   default()  → login → REST (get chats, messages) → WebSocket session
 *                (subscribe, presence ping, typing) → send messages via HTTP
 *
 * Usage:
 *   k6 run load-test/gomin-load-test.js
 *
 * Environment variables (all optional — defaults shown):
 *   BASE_URL      http://localhost:3000    HTTP API host (no /api suffix)
 *   WS_URL        ws://localhost:3000      WebSocket host
 *   SETUP_USERS   30                       Users registered during setup
 *   MAX_VUS       30                       Peak concurrent VUs
 *   RAMP_UP       1m                       Time to reach MAX_VUS
 *   SUSTAIN       3m                       Time at MAX_VUS before spike
 *   SPIKE_VUS     80                       VUs during spike stage
 *   SPIKE_DUR     2m                       Duration of spike
 *   MSG_PER_VU    5                        HTTP messages sent per VU iteration
 *   MSG_INTERVAL  2                        Seconds between messages (float)
 *
 * Prometheus output (requires k6 OSS + xk6-prometheus or k6 Cloud):
 *   k6 run --out=prometheus=namespace=gomin load-test/gomin-load-test.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────────────────
const _base     = (__ENV.BASE_URL     || 'http://localhost:3000');
const BASE_URL  = _base.replace(/\/$/, '') + '/api';
const WS_BASE   = (__ENV.WS_URL       || _base.replace(/^http/, 'ws')).replace(/\/$/, '');
const SETUP_USERS  = parseInt(__ENV.SETUP_USERS  || '30');
const MAX_VUS      = parseInt(__ENV.MAX_VUS      || '30');
const RAMP_UP      = __ENV.RAMP_UP   || '1m';
const SUSTAIN      = __ENV.SUSTAIN   || '3m';
const SPIKE_VUS    = parseInt(__ENV.SPIKE_VUS    || '80');
const SPIKE_DUR    = __ENV.SPIKE_DUR || '2m';
const MSG_PER_VU   = parseInt(__ENV.MSG_PER_VU   || '5');
const MSG_INTERVAL = parseFloat(__ENV.MSG_INTERVAL || '2') * 1000;

// ─── Custom metrics ───────────────────────────────────────────────────────────
const messagesSent    = new Counter('gomin_messages_sent');
const messagesFailed  = new Counter('gomin_messages_failed');
const wsConnected     = new Counter('gomin_ws_connected');
const wsErrors        = new Counter('gomin_ws_errors');
const authErrorRate   = new Rate('gomin_auth_error_rate');
const msgDuration     = new Trend('gomin_message_send_ms', true);

// ─── Scenario / thresholds ────────────────────────────────────────────────────
export const options = {
  scenarios: {
    gomin: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP,  target: MAX_VUS  },
        { duration: SUSTAIN,  target: MAX_VUS  },
        { duration: '30s',    target: SPIKE_VUS },
        { duration: SPIKE_DUR, target: SPIKE_VUS },
        { duration: '1m',     target: 0         },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed:        ['rate<0.05'],
    http_req_duration:      ['p(95)<2000'],
    gomin_auth_error_rate:  ['rate<0.10'],
    gomin_messages_failed:  ['count<100'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Produce a base64-encoded string of `byteCount` pseudo-random bytes. */
function dummyB64(byteCount) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let b64 = '';
  // Each 3 bytes → 4 base64 chars
  for (let i = 0; i < byteCount; i += 3) {
    const a = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const c = Math.floor(Math.random() * 256);
    b64 += alphabet[a >> 2];
    b64 += alphabet[((a & 3) << 4) | (b >> 4)];
    b64 += (i + 1 < byteCount) ? alphabet[((b & 15) << 2) | (c >> 6)] : '=';
    b64 += (i + 2 < byteCount) ? alphabet[c & 63] : '=';
  }
  return b64;
}

function e2eeKeys() {
  return {
    publicKey:            dummyB64(294), // ~2048-bit RSA public key placeholder
    encryptedPrivateKey:  dummyB64(128),
    encryptionSalt:       dummyB64(16),
    encryptionIv:         dummyB64(12),
    encryptionAuthTag:    dummyB64(16),
  };
}

function deviceInfo(vuId) {
  return {
    deviceId:   `k6-device-${vuId}`,
    deviceName: 'k6 on Linux',
    deviceType: 'WEB',
    os:         'Linux',
    browser:    'k6',
    appVersion: '1.0.0',
    userAgent:  `k6/load-test vu/${vuId}`,
  };
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function registerUser(idx) {
  const suffix  = `${idx}_${randSuffix()}`;
  const payload = {
    username:   `lt_${suffix}`.slice(0, 30),
    email:      `lt_${suffix}@k6.local`,
    password:   'L0adTest!Run1k6',
    e2eeKeys:   e2eeKeys(),
    deviceInfo: deviceInfo(`setup_${idx}`),
  };

  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(payload), {
    headers: JSON_HEADERS,
    tags:    { name: 'register' },
  });

  if (!check(res, { 'register 201': (r) => r.status === 201 })) {
    console.warn(`[setup] register[${idx}] failed ${res.status}: ${res.body?.slice(0, 300)}`);
    return null;
  }

  return { username: payload.username, email: payload.email, password: payload.password };
}

function loginUser(email, password, vuId) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password,
    deviceInfo: deviceInfo(vuId),
  }), {
    headers: JSON_HEADERS,
    tags:    { name: 'login' },
  });

  const ok = res.status === 200 || res.status === 201;
  authErrorRate.add(ok ? 0 : 1);

  if (!ok) {
    console.warn(`[VU${vuId}] login failed ${res.status}: ${res.body?.slice(0, 200)}`);
    return null;
  }

  try {
    const body = JSON.parse(res.body);
    return body.sessionToken ?? body.session_token ?? null;
  } catch {
    return null;
  }
}

// ─── Setup (single execution before test) ────────────────────────────────────
export function setup() {
  console.log(`[setup] Registering ${SETUP_USERS} users…`);
  const users = [];

  for (let i = 0; i < SETUP_USERS; i++) {
    const u = registerUser(i);
    if (u) users.push(u);
    sleep(0.05); // gentle pacing during setup
  }

  console.log(`[setup] Registered ${users.length}/${SETUP_USERS} users`);

  if (users.length < 2) {
    throw new Error(`Too few users registered (${users.length}); aborting`);
  }

  // Admin user creates the shared group chat
  const adminToken = loginUser(users[0].email, users[0].password, 'setup_admin');
  if (!adminToken) throw new Error('[setup] Admin login failed');

  const memberUsernames = users.slice(1, 100).map((u) => u.username); // cap at 99 (+self = 100)
  const chatRes = http.post(`${BASE_URL}/chats`, JSON.stringify({
    type:            'GROUP',
    name:            'k6 Load Test Chat',
    memberUsernames,
  }), {
    headers: authHeaders(adminToken),
    tags:    { name: 'create_chat' },
  });

  if (!check(chatRes, { 'create chat 201': (r) => r.status === 201 })) {
    throw new Error(`[setup] Create chat failed ${chatRes.status}: ${chatRes.body?.slice(0, 300)}`);
  }

  let chatId;
  try {
    const body = JSON.parse(chatRes.body);
    chatId = body.id ?? body.chatId ?? body.chat?.id;
  } catch {
    throw new Error(`[setup] Could not parse chat response: ${chatRes.body?.slice(0, 300)}`);
  }

  if (!chatId) throw new Error(`[setup] No chatId in response: ${chatRes.body?.slice(0, 300)}`);

  console.log(`[setup] Group chat ready: ${chatId}`);
  return { users, chatId };
}

// ─── Default VU loop ──────────────────────────────────────────────────────────
export default function (data) {
  const { users, chatId } = data;

  // Each VU gets a stable user from the pool
  const user = users[(__VU - 1) % users.length];

  // 1. Login
  const token = loginUser(user.email, user.password, __VU);
  if (!token) {
    sleep(2);
    return;
  }

  // 2. GET /chats  (simulates sidebar load)
  const chatsRes = http.get(`${BASE_URL}/chats`, {
    headers: authHeaders(token),
    tags:    { name: 'get_chats' },
  });
  check(chatsRes, { 'get chats 200': (r) => r.status === 200 });

  // 3. GET messages (simulates opening the chat)
  const msgsRes = http.get(`${BASE_URL}/chats/${chatId}/messages?limit=20`, {
    headers: authHeaders(token),
    tags:    { name: 'get_messages' },
  });
  check(msgsRes, { 'get messages 200': (r) => r.status === 200 });

  // 4. WebSocket session (Socket.io)
  socketSession(token, chatId);

  sleep(1);
}

// ─── Socket.io session ────────────────────────────────────────────────────────
// Implements Engine.io v4 + Socket.io v4 protocol manually over raw WebSocket.
//
// Packet format:
//   EIO type (1 char) + SIO type (1 char, only when EIO=4) + JSON data
//   EIO: 0=open 1=close 2=ping 3=pong 4=message
//   SIO: 0=CONNECT 1=DISCONNECT 2=EVENT 3=ACK 4=CONNECT_ERROR
//
function socketSession(token, chatId) {
  const url = `${WS_BASE}/socket.io/?EIO=4&transport=websocket`;

  let sioConnected = false;
  let msgCount     = 0;
  let done         = false;

  const response = ws.connect(url, {}, (socket) => {
    socket.on('message', (raw) => {
      if (done || !raw || raw.length === 0) return;

      const eioType = raw.charCodeAt(0) - 48;

      // EIO 0 — open: server sends session info, reply with SIO CONNECT + auth
      if (eioType === 0) {
        socket.send(`40${JSON.stringify({ token })}`);
        return;
      }

      // EIO 2 — ping heartbeat
      if (eioType === 2) {
        socket.send('3'); // pong
        return;
      }

      // EIO 4 — Socket.io message
      if (eioType === 4) {
        const sioRaw  = raw.slice(1);
        const sioType = sioRaw.charCodeAt(0) - 48;

        // SIO 0 — CONNECT confirmation
        if (sioType === 0) {
          sioConnected = true;
          wsConnected.add(1);

          // Subscribe to the shared chat and send initial presence ping
          socket.send(`42${JSON.stringify(['chat:subscribe', { chatId }])}`);
          socket.send(`42${JSON.stringify(['presence:ping'])}`);
          return;
        }

        // SIO 1 — server-initiated DISCONNECT
        if (sioType === 1) {
          done = true;
          socket.close();
          return;
        }

        // SIO 4 — CONNECT_ERROR (e.g. bad token)
        if (sioType === 4) {
          wsErrors.add(1);
          done = true;
          socket.close();
          return;
        }

        // SIO 2 — incoming EVENT (new message, etc.): nothing to do
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
      done = true;
    });

    // Periodically send a message via REST + typing event via WS
    socket.setInterval(() => {
      if (!sioConnected || done) return;

      if (msgCount >= MSG_PER_VU) {
        done = true;
        socket.close();
        return;
      }

      // Typing indicator (fire-and-forget over WS)
      socket.send(`42${JSON.stringify(['typing:start', { chatId }])}`);

      // Send message via HTTP POST (messages are REST, WS is read-only broadcast)
      const t0  = Date.now();
      const res = http.post(
        `${BASE_URL}/chats/${chatId}/messages`,
        JSON.stringify({
          type: 'TEXT',
          payload: {
            encryptedContent: dummyB64(48),
            iv:               dummyB64(12),
            authTag:          dummyB64(16),
            keyVersion:       0,
            iteration:        msgCount,
          },
        }),
        {
          headers: authHeaders(token),
          tags:    { name: 'send_message' },
        },
      );

      msgDuration.add(Date.now() - t0);

      if (check(res, { 'message 201': (r) => r.status === 201 })) {
        messagesSent.add(1);
      } else {
        messagesFailed.add(1);
      }

      socket.send(`42${JSON.stringify(['typing:stop', { chatId }])}`);
      msgCount++;
    }, MSG_INTERVAL);

    // Hard timeout: close after all messages + buffer
    socket.setTimeout(() => {
      done = true;
      socket.close();
    }, MSG_PER_VU * MSG_INTERVAL + 10_000);
  });

  check(response, { 'ws handshake 101': (r) => r && r.status === 101 });
}
