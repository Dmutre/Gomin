/* eslint-disable max-len */
'use strict';

const crypto = require('node:crypto');
const BASE_URL = process.argv[2]?.replace(/\/$/, '') ?? 'http://api.84.247.133.45.nip.io/api';

// Unique run ID — collision-safe across parallel runs and reruns
const RUN_ID = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

// ─── Logging ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function ok(label) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✗  ${label}: ${msg}`);
  failures.push({ label, error: msg, stack: err?.stack });
  failed++;
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ─── Crypto helpers ──────────────────────────────────────────────────────────

function generateRSAKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function encryptPrivateKey(privateKeyPem, password) {
  const salt = crypto.randomBytes(16);
  const iv   = crypto.randomBytes(12);
  const key  = crypto.pbkdf2Sync(password, salt, 200_000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKeyPem, 'utf8'),
    cipher.final(),
  ]);
  return {
    encryptedPrivateKey: encrypted.toString('base64'),
    encryptionSalt:      salt.toString('base64'),
    encryptionIv:        iv.toString('base64'),
    encryptionAuthTag:   cipher.getAuthTag().toString('base64'),
  };
}

function decryptPrivateKey({ encryptedPrivateKey, encryptionSalt, encryptionIv, encryptionAuthTag }, password) {
  const key = crypto.pbkdf2Sync(password, Buffer.from(encryptionSalt, 'base64'), 200_000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encryptionIv, 'base64'));
  decipher.setAuthTag(Buffer.from(encryptionAuthTag, 'base64'));
  return decipher.update(Buffer.from(encryptedPrivateKey, 'base64')) + decipher.final('utf8');
}

function generateChainKey() {
  return crypto.randomBytes(32);
}

function deriveMessageKey(chainKey, iteration) {
  // HKDF-like: HMAC-SHA256(chainKey, "msg" || iteration)
  const info = Buffer.alloc(4);
  info.writeUInt32BE(iteration);
  return crypto.createHmac('sha256', chainKey).update(Buffer.concat([Buffer.from('msg'), info])).digest();
}

function encryptMessage(plaintext, messageKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', messageKey, iv);
  const encryptedContent = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return {
    encryptedContent: encryptedContent.toString('base64'),
    iv:               iv.toString('base64'),
    authTag:          cipher.getAuthTag().toString('base64'),
  };
}

function decryptMessage({ encryptedContent, iv, authTag }, messageKey) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', messageKey, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return decipher.update(Buffer.from(encryptedContent, 'base64')) + decipher.final('utf8');
}

function encryptChainKey(chainKey, recipientPublicKeyPem) {
  return crypto.publicEncrypt(
    { key: recipientPublicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    chainKey,
  ).toString('base64');
}

function decryptChainKey(encryptedBase64, privateKeyPem) {
  return crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(encryptedBase64, 'base64'),
  );
}

// ─── API client ──────────────────────────────────────────────────────────────

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${method} ${path}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

const post = (path, body, token) => api('POST', path, body, token);
const get  = (path, token)       => api('GET',  path, null, token);

// ─── Device info stub ────────────────────────────────────────────────────────

function deviceInfo() {
  return {
    deviceId:   crypto.randomUUID(),
    deviceName: 'Test Runner',
    deviceType: 'DESKTOP',
    os:         'Linux',
    browser:    'Node.js',
    appVersion: '0.1.0',
    userAgent:  'test-e2ee/1.0',
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testCryptoAlgorithms() {
  section('Crypto algorithm unit tests');

  // PBKDF2 + AES-GCM private key encryption round-trip
  try {
    const { publicKey, privateKey } = generateRSAKeyPair();
    const password = 'TestPassw0rd!';
    const encrypted = encryptPrivateKey(privateKey, password);
    const decrypted = decryptPrivateKey(encrypted, password);
    if (decrypted !== privateKey) throw new Error('Private key mismatch after decrypt');
    ok('PBKDF2 + AES-256-GCM private key round-trip');
  } catch (e) { fail('PBKDF2 + AES-256-GCM private key round-trip', e); }

  // Wrong password should throw
  try {
    const { privateKey } = generateRSAKeyPair();
    const encrypted = encryptPrivateKey(privateKey, 'correct');
    let threw = false;
    try { decryptPrivateKey(encrypted, 'wrong'); } catch { threw = true; }
    if (!threw) throw new Error('Expected auth tag failure with wrong password');
    ok('AES-GCM auth tag rejects wrong password');
  } catch (e) { fail('AES-GCM auth tag rejects wrong password', e); }

  // Chain key derivation — different iterations produce different keys
  try {
    const chainKey = generateChainKey();
    const k0 = deriveMessageKey(chainKey, 0);
    const k1 = deriveMessageKey(chainKey, 1);
    if (k0.equals(k1)) throw new Error('iteration 0 and 1 produced same key');
    ok('Chain key derivation produces unique key per iteration');
  } catch (e) { fail('Chain key derivation produces unique key per iteration', e); }

  // Chain key derivation — deterministic
  try {
    const chainKey = generateChainKey();
    const k0a = deriveMessageKey(chainKey, 5);
    const k0b = deriveMessageKey(chainKey, 5);
    if (!k0a.equals(k0b)) throw new Error('Same iteration should give same key');
    ok('Chain key derivation is deterministic');
  } catch (e) { fail('Chain key derivation is deterministic', e); }

  // AES-256-GCM message encryption round-trip
  try {
    const chainKey = generateChainKey();
    const msgKey = deriveMessageKey(chainKey, 0);
    const plaintext = 'Hello, E2EE world! 🔐';
    const { encryptedContent, iv, authTag } = encryptMessage(plaintext, msgKey);
    const decrypted = decryptMessage({ encryptedContent, iv, authTag }, msgKey);
    if (decrypted !== plaintext) throw new Error(`Decrypted: "${decrypted}"`);
    ok('AES-256-GCM message encrypt / decrypt round-trip');
  } catch (e) { fail('AES-256-GCM message encrypt / decrypt round-trip', e); }

  // AES-256-GCM tamper detection
  try {
    const key = deriveMessageKey(generateChainKey(), 0);
    const { encryptedContent, iv, authTag } = encryptMessage('secret', key);
    const tampered = Buffer.from(encryptedContent, 'base64');
    tampered[0] ^= 0xff;
    let threw = false;
    try { decryptMessage({ encryptedContent: tampered.toString('base64'), iv, authTag }, key); } catch { threw = true; }
    if (!threw) throw new Error('Expected auth failure on tampered ciphertext');
    ok('AES-256-GCM detects ciphertext tampering');
  } catch (e) { fail('AES-256-GCM detects ciphertext tampering', e); }

  // RSA-OAEP chain key wrapping round-trip
  try {
    const { publicKey, privateKey } = generateRSAKeyPair();
    const chainKey = generateChainKey();
    const wrapped   = encryptChainKey(chainKey, publicKey);
    const unwrapped = decryptChainKey(wrapped, privateKey);
    if (!chainKey.equals(unwrapped)) throw new Error('Chain key mismatch after RSA unwrap');
    ok('RSA-OAEP chain key wrap / unwrap round-trip');
  } catch (e) { fail('RSA-OAEP chain key wrap / unwrap round-trip', e); }

  // RSA-OAEP: wrong private key should fail
  try {
    const { publicKey } = generateRSAKeyPair();
    const { privateKey: otherPrivate } = generateRSAKeyPair();
    const wrapped = encryptChainKey(generateChainKey(), publicKey);
    let threw = false;
    try { decryptChainKey(wrapped, otherPrivate); } catch { threw = true; }
    if (!threw) throw new Error('Expected RSA decrypt failure with wrong key');
    ok('RSA-OAEP rejects wrong private key');
  } catch (e) { fail('RSA-OAEP rejects wrong private key', e); }
}

async function testE2EEFlow() {
  section('E2EE API integration test');

  const alicePassword = 'AliceStr0ng!Pass';
  const bobPassword   = 'B0bStr0ng!Passw0rd';

  // ── Generate key pairs ──────────────────────────────────────────────────
  const alice = { name: 'alice', password: alicePassword };
  const bob   = { name: 'bob',   password: bobPassword };

  try {
    alice.keys = generateRSAKeyPair();
    alice.encryptedKeys = encryptPrivateKey(alice.keys.privateKey, alice.password);
    bob.keys = generateRSAKeyPair();
    bob.encryptedKeys = encryptPrivateKey(bob.keys.privateKey, bob.password);
    ok('RSA key pairs generated for Alice and Bob');
  } catch (e) { fail('Key pair generation', e); return; }

  // ── Register Alice ──────────────────────────────────────────────────────
  try {
    const res = await post('/auth/register', {
      username: `alice_${RUN_ID}`,
      email:    `alice_${RUN_ID}@test.local`,
      password: alice.password,
      e2eeKeys: {
        publicKey: alice.keys.publicKey,
        ...alice.encryptedKeys,
      },
      deviceInfo: deviceInfo(),
    });
    alice.token  = res.sessionToken;
    alice.userId = res.user?.id;
    ok(`Alice registered (userId: ${alice.userId})`);
  } catch (e) { fail('Alice registration', e); return; }

  // ── Register Bob ────────────────────────────────────────────────────────
  try {
    const res = await post('/auth/register', {
      username: `bob_${RUN_ID}`,
      email:    `bob_${RUN_ID}@test.local`,
      password: bob.password,
      e2eeKeys: {
        publicKey: bob.keys.publicKey,
        ...bob.encryptedKeys,
      },
      deviceInfo: deviceInfo(),
    });
    bob.token  = res.sessionToken;
    bob.userId = res.user?.id;
    ok(`Bob registered (userId: ${bob.userId})`);
  } catch (e) { fail('Bob registration', e); return; }

  // ── Login (verify session token works) ─────────────────────────────────
  try {
    const res = await post('/auth/login', {
      email:      `alice_${RUN_ID}@test.local`,
      password:   alice.password,
      deviceInfo: deviceInfo(),
    });
    alice.token = res.sessionToken;
    ok('Alice login — session token refreshed');
  } catch (e) { fail('Alice login', e); return; }

  // ── Duplicate email check → 409 ─────────────────────────────────────────
  try {
    await post('/auth/register', {
      username: `alice2_${RUN_ID}`,
      email:    `alice_${RUN_ID}@test.local`,
      password: alice.password,
      e2eeKeys: { publicKey: alice.keys.publicKey, ...alice.encryptedKeys },
      deviceInfo: deviceInfo(),
    });
    fail('Duplicate email should return 409', new Error('No error thrown'));
  } catch (e) {
    if (e.status === 409) ok('Duplicate email correctly returns 409');
    else fail('Duplicate email should return 409', e);
  }

  // ── Get Bob's public key ────────────────────────────────────────────────
  try {
    const res = await get(`/auth/users/${bob.userId}/public-key`, alice.token);
    bob.fetchedPublicKey = res.publicKey;
    if (!bob.fetchedPublicKey?.includes('PUBLIC KEY')) throw new Error('Not a PEM public key');
    ok("Fetched Bob's RSA public key");
  } catch (e) { fail("Fetch Bob's public key", e); return; }

  // ── Create direct chat ──────────────────────────────────────────────────
  let chatId;
  try {
    const res = await post('/chats', {
      type:          1, // CHAT_TYPE_DIRECT
      memberUserIds: [bob.userId],
    }, alice.token);
    chatId = res.chat?.id ?? res.id;
    ok(`Direct chat created (chatId: ${chatId})`);
  } catch (e) { fail('Create direct chat', e); return; }

  // ── Alice generates chain key, wraps for Bob ────────────────────────────
  let aliceChainKey;
  try {
    aliceChainKey = generateChainKey();
    const wrappedForBob = encryptChainKey(aliceChainKey, bob.fetchedPublicKey);
    // Also wrap for self so Alice can verify her own messages
    const wrappedForAlice = encryptChainKey(aliceChainKey, alice.keys.publicKey);

    await post(`/chats/${chatId}/sender-keys`, {
      keys: [
        { senderId: alice.userId, recipientId: bob.userId,   encryptedSenderKey: wrappedForBob,   keyVersion: 0 },
        { senderId: alice.userId, recipientId: alice.userId, encryptedSenderKey: wrappedForAlice, keyVersion: 0 },
      ],
    }, alice.token);
    ok('Alice stored sender keys (wrapped for Bob and self)');
  } catch (e) { fail('Alice store sender keys', e); return; }

  // ── Bob generates chain key, wraps for Alice ────────────────────────────
  let bobChainKey;
  try {
    bobChainKey = generateChainKey();
    const alicePublicKey = (await get(`/auth/users/${alice.userId}/public-key`, bob.token)).publicKey;
    const wrappedForAlice = encryptChainKey(bobChainKey, alicePublicKey);
    const wrappedForBob   = encryptChainKey(bobChainKey, bob.keys.publicKey);

    await post(`/chats/${chatId}/sender-keys`, {
      keys: [
        { senderId: bob.userId, recipientId: alice.userId, encryptedSenderKey: wrappedForAlice, keyVersion: 0 },
        { senderId: bob.userId, recipientId: bob.userId,   encryptedSenderKey: wrappedForBob,   keyVersion: 0 },
      ],
    }, bob.token);
    ok('Bob stored sender keys (wrapped for Alice and self)');
  } catch (e) { fail('Bob store sender keys', e); return; }

  // ── Alice sends encrypted message ───────────────────────────────────────
  const originalText = `Hello Bob! This is an E2EE message. 🔐 run=${RUN_ID}`;
  let sentMessageId;
  try {
    const msgKey   = deriveMessageKey(aliceChainKey, 0);
    const payload  = encryptMessage(originalText, msgKey);
    const res = await post(`/chats/${chatId}/messages`, {
      payload: { ...payload, keyVersion: 0, iteration: 0 },
      type: 1, // MESSAGE_TYPE_TEXT
    }, alice.token);
    sentMessageId = res.message?.id ?? res.id;
    ok(`Alice sent encrypted message (id: ${sentMessageId})`);
  } catch (e) { fail('Alice send encrypted message', e); return; }

  // ── Bob fetches messages ────────────────────────────────────────────────
  let receivedPayload;
  try {
    const res = await get(`/chats/${chatId}/messages?limit=10`, bob.token);
    const messages = res.messages ?? res;
    const msg = messages.find(m => m.id === sentMessageId) ?? messages[messages.length - 1];
    if (!msg) throw new Error('Message not found in response');
    receivedPayload = msg.payload;
    ok(`Bob fetched messages (${messages.length} total)`);
  } catch (e) { fail('Bob fetch messages', e); return; }

  // ── Bob retrieves Alice's wrapped chain key ─────────────────────────────
  let bobDecryptedAliceChainKey;
  try {
    const res = await get(`/chats/${chatId}/sender-keys/${alice.userId}`, bob.token);
    const encryptedSenderKey = res.encryptedSenderKey ?? res.key?.encryptedSenderKey;
    if (!encryptedSenderKey) throw new Error(`No encryptedSenderKey in response: ${JSON.stringify(res)}`);
    bobDecryptedAliceChainKey = decryptChainKey(encryptedSenderKey, bob.keys.privateKey);
    if (!aliceChainKey.equals(bobDecryptedAliceChainKey)) throw new Error('Decrypted chain key does not match original');
    ok("Bob unwrapped Alice's chain key via RSA-OAEP");
  } catch (e) { fail("Bob unwrap Alice's chain key", e); return; }

  // ── Bob decrypts the message ────────────────────────────────────────────
  try {
    const msgKey   = deriveMessageKey(bobDecryptedAliceChainKey, receivedPayload.iteration ?? 0);
    const decrypted = decryptMessage(receivedPayload, msgKey);
    if (decrypted !== originalText) throw new Error(`Expected: "${originalText}"\nGot:      "${decrypted}"`);
    ok(`Bob decrypted message: "${decrypted}"`);
  } catch (e) { fail('Bob decrypt message', e); return; }

  // ── Verify active sessions ──────────────────────────────────────────────
  try {
    const res = await get('/auth/sessions', alice.token);
    const sessions = res.sessions ?? res;
    if (!Array.isArray(sessions) || sessions.length === 0) throw new Error('No sessions returned');
    ok(`Alice has ${sessions.length} active session(s)`);
  } catch (e) { fail('Alice list sessions', e); }

  // ── Logout ──────────────────────────────────────────────────────────────
  try {
    await post('/auth/logout', null, alice.token);
    ok('Alice logged out');
  } catch (e) { fail('Alice logout', e); }

  // ── Token invalidated after logout ──────────────────────────────────────
  try {
    await get('/auth/sessions', alice.token);
    fail('Token should be invalid after logout', new Error('Request succeeded unexpectedly'));
  } catch (e) {
    if (e.status === 401) ok('Invalidated token correctly returns 401');
    else fail('Invalidated token check', e);
  }
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nGomin E2EE Test Suite');
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`Node:     ${process.version}`);

  await testCryptoAlgorithms();
  await testE2EEFlow();

  section('Results');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    for (const f of failures) {
      console.error(`  • ${f.label}`);
      console.error(`    ${f.error}`);
    }
    console.log('\n--- Failure report (copy-paste friendly) ---');
    console.log(JSON.stringify({ baseUrl: BASE_URL, node: process.version, failures }, null, 2));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});
