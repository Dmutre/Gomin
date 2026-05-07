/**
 * Gomin — k6 load test v2
 *
 * setup()    → register N users, login all (token cache), create M group chats,
 *              distribute users across chats (primary + 25% secondary)
 * default()  → NO login per iteration — picks user + random assigned chat →
 *              GET /chats, GET /messages, WebSocket session with typing + messages
 *
 * Usage (bash):
 *   set -a; source load-test/.env.small; set +a
 *   k6 run load-test/gomin-load-test.js
 *
 * Usage (PowerShell):
 *   Get-Content load-test\.env.small | ForEach-Object {
 *     if ($_ -match '^([^#=\s]+)\s*=\s*(.*)$') { Set-Item "env:$($matches[1])" $matches[2] }
 *   }
 *   k6 run load-test/gomin-load-test.js
 *
 * Environment variables (defaults → .env.small profile):
 *   BASE_URL       http://localhost:3000    API host (no /api suffix)
 *   WS_URL         <derived from BASE_URL>  WebSocket host (auto ws/wss)
 *   SETUP_USERS    60                       Users registered in setup
 *   NUM_CHATS      3                        Group chats created in setup
 *   MAX_VUS        35                       Peak concurrent VUs (~20 RPS)
 *   RAMP_UP        1m                       Ramp-up duration
 *   SUSTAIN        3m                       Sustained load duration
 *   SPIKE_VUS      50                       VUs during spike
 *   SPIKE_DUR      1m                       Spike duration
 *   MSG_PER_VU     5                        HTTP messages sent per WS session
 *   MSG_INTERVAL   2                        Seconds between messages
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────────────────
const _base        = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE_URL     = _base + '/api';
const WS_BASE      = (__ENV.WS_URL  || _base.replace(/^http/, 'ws')).replace(/\/$/, '');
const SETUP_USERS  = parseInt(__ENV.SETUP_USERS  || '60');
const NUM_CHATS    = parseInt(__ENV.NUM_CHATS     || '3');
const MAX_VUS      = parseInt(__ENV.MAX_VUS       || '35');
const RAMP_UP      = __ENV.RAMP_UP   || '1m';
const SUSTAIN      = __ENV.SUSTAIN   || '3m';
const SPIKE_VUS    = parseInt(__ENV.SPIKE_VUS     || '50');
const SPIKE_DUR    = __ENV.SPIKE_DUR || '1m';
const MSG_PER_VU   = parseInt(__ENV.MSG_PER_VU    || '5');
const MSG_INTERVAL = parseFloat(__ENV.MSG_INTERVAL || '2') * 1000;

// ─── Custom metrics ───────────────────────────────────────────────────────────
const messagesSent   = new Counter('gomin_messages_sent');
const messagesFailed = new Counter('gomin_messages_failed');
const wsConnected    = new Counter('gomin_ws_connected');
const wsErrors       = new Counter('gomin_ws_errors');
const authErrorRate  = new Rate('gomin_auth_error_rate');
const msgDuration    = new Trend('gomin_message_send_ms', true);

// ─── Scenarios / thresholds ───────────────────────────────────────────────────
export const options = {
  scenarios: {
    gomin: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP,   target: MAX_VUS   },
        { duration: SUSTAIN,   target: MAX_VUS   },
        { duration: '30s',     target: SPIKE_VUS },
        { duration: SPIKE_DUR, target: SPIKE_VUS },
        { duration: '1m',      target: 0         },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed:       ['rate<0.05'],
    http_req_duration:     ['p(95)<2000'],
    gomin_auth_error_rate: ['rate<0.10'],
    gomin_messages_failed: ['count<100'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function dummyB64(byteCount) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < byteCount; i += 3) {
    const a = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const c = Math.floor(Math.random() * 256);
    out += alpha[a >> 2];
    out += alpha[((a & 3) << 4) | (b >> 4)];
    out += (i + 1 < byteCount) ? alpha[((b & 15) << 2) | (c >> 6)] : '=';
    out += (i + 2 < byteCount) ? alpha[c & 63] : '=';
  }
  return out;
}

function e2eeKeys() {
  return {
    publicKey:           dummyB64(294),
    encryptedPrivateKey: dummyB64(128),
    encryptionSalt:      dummyB64(16),
    encryptionIv:        dummyB64(12),
    encryptionAuthTag:   dummyB64(16),
  };
}

function deviceInfo(id) {
  return {
    deviceId:   `k6-device-${id}`,
    deviceName: 'k6 on Linux',
    deviceType: 'WEB',
    os:         'Linux',
    browser:    'k6',
    appVersion: '1.0.0',
    userAgent:  `k6/load-test id/${id}`,
  };
}

const JSON_H = { 'Content-Type': 'application/json' };
function authH(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Low-level auth ───────────────────────────────────────────────────────────
function registerUser(idx) {
  const suffix  = `${idx}_${randSuffix()}`;
  const payload = {
    username:   `lt_${suffix}`.slice(0, 30),
    email:      `lt_${suffix}@k6.local`,
    password:   'L0adTest!Run1k6',
    e2eeKeys:   e2eeKeys(),
    deviceInfo: deviceInfo(`reg_${idx}`),
  };
  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(payload), {
    headers: JSON_H,
    tags:    { name: 'register' },
  });
  if (!check(res, { 'register 201': (r) => r.status === 201 })) {
    console.warn(`[setup] register[${idx}] → ${res.status}: ${res.body?.slice(0, 200)}`);
    return null;
  }
  return { username: payload.username, email: payload.email, password: payload.password };
}

function loginUser(email, password, id) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password,
    deviceInfo: deviceInfo(id),
  }), {
    headers: JSON_H,
    tags:    { name: 'login' },
  });
  const ok = res.status === 200 || res.status === 201;
  authErrorRate.add(ok ? 0 : 1);
  if (!ok) {
    console.warn(`[login:${id}] → ${res.status}: ${res.body?.slice(0, 200)}`);
    return null;
  }
  try {
    const body = JSON.parse(res.body);
    return body.sessionToken ?? body.session_token ?? null;
  } catch {
    return null;
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  // 1. Register users
  console.log(`[setup] Registering ${SETUP_USERS} users…`);
  const creds = [];
  for (let i = 0; i < SETUP_USERS; i++) {
    const u = registerUser(i);
    if (u) creds.push(u);
    sleep(0.05);
  }
  console.log(`[setup] Registered ${creds.length}/${SETUP_USERS}`);
  if (creds.length < 2) throw new Error(`Only ${creds.length} users registered — aborting`);

  // 2. Login all users and cache tokens
  console.log(`[setup] Logging in ${creds.length} users (token cache)…`);
  const users = [];
  for (let i = 0; i < creds.length; i++) {
    const token = loginUser(creds[i].email, creds[i].password, `setup_${i}`);
    if (token) users.push({ ...creds[i], token, chatIds: [] });
    sleep(0.05);
  }
  console.log(`[setup] Cached tokens for ${users.length}/${creds.length} users`);
  if (users.length < 2) throw new Error(`Only ${users.length} tokens cached — aborting`);

  // 3. Distribute users across group chats
  const numChats = Math.min(NUM_CHATS, Math.floor(users.length / 2));
  const memberSets = Array.from({ length: numChats }, () => new Set([0])); // admin in all

  for (let i = 1; i < users.length; i++) {
    const primary = (i - 1) % numChats;
    memberSets[primary].add(i);
    // 25% chance of also joining a second chat — creates cross-group message traffic
    if (numChats > 1 && Math.random() < 0.25) {
      let sec;
      do { sec = Math.floor(Math.random() * numChats); } while (sec === primary);
      memberSets[sec].add(i);
    }
  }

  // 4. Create chats and assign chatIds back to users
  const adminToken = users[0].token;
  console.log(`[setup] Creating ${numChats} group chats…`);

  for (let i = 0; i < numChats; i++) {
    const memberUsernames = [...memberSets[i]]
      .filter((idx) => idx !== 0)
      .map((idx) => users[idx].username)
      .slice(0, 99);

    const res = http.post(
      `${BASE_URL}/chats`,
      JSON.stringify({ type: 'GROUP', name: `k6 Group ${i + 1}`, memberUsernames }),
      { headers: authH(adminToken), tags: { name: 'create_chat' } },
    );
    if (!check(res, { 'create chat 201': (r) => r.status === 201 })) {
      throw new Error(`[setup] create chat ${i + 1} → ${res.status}: ${res.body?.slice(0, 300)}`);
    }

    let chatId;
    try {
      const body = JSON.parse(res.body);
      chatId = body.id ?? body.chatId ?? body.chat?.id;
    } catch {
      throw new Error(`[setup] cannot parse chat response: ${res.body?.slice(0, 300)}`);
    }
    if (!chatId) throw new Error(`[setup] no chatId in: ${res.body?.slice(0, 300)}`);

    for (const idx of memberSets[i]) {
      users[idx].chatIds.push(chatId);
    }
    console.log(`  chat[${i + 1}] ${chatId} — ${memberSets[i].size} members`);
    sleep(0.1);
  }

  // Fallback: any user somehow with no chat gets chat 0
  const fallbackId = users[0].chatIds[0];
  for (const u of users) {
    if (u.chatIds.length === 0) u.chatIds.push(fallbackId);
  }

  console.log(`[setup] Done — ${users.length} users, ${numChats} chats, ready`);
  return { users };
}

// ─── Default VU loop ──────────────────────────────────────────────────────────
export default function (data) {
  const { users } = data;
  const user = users[(__VU - 1) % users.length];

  if (!user?.token) {
    sleep(2);
    return;
  }

  // Pick a random chat this user belongs to
  const chatId = user.chatIds[Math.floor(Math.random() * user.chatIds.length)];

  // Sidebar: list all user chats
  const chatsRes = http.get(`${BASE_URL}/chats`, {
    headers: authH(user.token),
    tags:    { name: 'get_chats' },
  });
  check(chatsRes, { 'get chats 200': (r) => r.status === 200 });

  // Open chat: fetch recent messages
  const msgsRes = http.get(`${BASE_URL}/chats/${chatId}/messages?limit=20`, {
    headers: authH(user.token),
    tags:    { name: 'get_messages' },
  });
  check(msgsRes, { 'get messages 200': (r) => r.status === 200 });

  // Live session: WebSocket with typing indicators + message sends
  socketSession(user.token, chatId);

  sleep(1);
}

// ─── Socket.io (EIO4 / SIO4) session ─────────────────────────────────────────
//
// Wire format: EIO-type (1 char) + SIO-type (1 char, only if EIO=4) + JSON
//   EIO: 0=open  2=ping  3=pong  4=message
//   SIO: 0=CONNECT  1=DISCONNECT  2=EVENT  4=CONNECT_ERROR
//
function socketSession(token, chatId) {
  const url = `${WS_BASE}/socket.io/?EIO=4&transport=websocket`;

  let sioReady = false;
  let msgCount = 0;
  let done     = false;

  const res = ws.connect(url, {}, (socket) => {
    socket.on('message', (raw) => {
      if (done || !raw) return;
      const eio = raw.charCodeAt(0) - 48;

      if (eio === 0) {
        // EIO open — authenticate via SIO CONNECT
        socket.send(`40${JSON.stringify({ token })}`);
        return;
      }

      if (eio === 2) {
        // EIO ping — reply with pong to keep connection alive
        socket.send('3');
        return;
      }

      if (eio === 4) {
        const sio = raw.charCodeAt(1) - 48;

        if (sio === 0) {
          // SIO CONNECT — subscribe to chat + announce presence
          sioReady = true;
          wsConnected.add(1);
          socket.send(`42${JSON.stringify(['chat:subscribe', { chatId }])}`);
          socket.send(`42${JSON.stringify(['presence:ping'])}`);
          return;
        }

        if (sio === 1) {
          done = true;
          socket.close();
          return;
        }

        if (sio === 4) {
          // SIO CONNECT_ERROR (bad token etc.)
          wsErrors.add(1);
          done = true;
          socket.close();
          return;
        }
        // sio === 2 (incoming EVENT: new message broadcast) — nothing to do
      }
    });

    socket.on('error', () => {
      wsErrors.add(1);
      done = true;
    });

    // Periodic: typing → POST message → stop typing
    socket.setInterval(() => {
      if (!sioReady || done) return;
      if (msgCount >= MSG_PER_VU) {
        done = true;
        socket.close();
        return;
      }

      socket.send(`42${JSON.stringify(['typing:start', { chatId }])}`);

      const t0  = Date.now();
      const mRes = http.post(
        `${BASE_URL}/chats/${chatId}/messages`,
        JSON.stringify({
          type:    'TEXT',
          payload: {
            encryptedContent: dummyB64(48),
            iv:               dummyB64(12),
            authTag:          dummyB64(16),
            keyVersion:       0,
            iteration:        msgCount,
          },
        }),
        { headers: authH(token), tags: { name: 'send_message' } },
      );
      msgDuration.add(Date.now() - t0);

      if (check(mRes, { 'message 201': (r) => r.status === 201 })) {
        messagesSent.add(1);
      } else {
        messagesFailed.add(1);
      }

      socket.send(`42${JSON.stringify(['typing:stop', { chatId }])}`);
      msgCount++;
    }, MSG_INTERVAL);

    // Hard upper bound — close after all messages + generous buffer
    socket.setTimeout(() => {
      done = true;
      socket.close();
    }, MSG_PER_VU * MSG_INTERVAL + 10_000);
  });

  check(res, { 'ws handshake 101': (r) => r && r.status === 101 });
}
