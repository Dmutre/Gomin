// tools/scripts/jwt-demo.mjs
// node tools/scripts/jwt-demo.mjs

import { createSign, createVerify, generateKeyPairSync } from 'crypto';

// ============================================================
// 1. Генерація ключів (в реальності робиться один раз openssl)
// ============================================================

console.log('🔑 Генерація RSA ключової пари...\n');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('Private key (перші 60 символів):');
console.log(privateKey.slice(0, 60) + '...\n');

console.log('Public key (перші 60 символів):');
console.log(publicKey.slice(0, 60) + '...\n');

// ============================================================
// 2. Хелпери
// ============================================================

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

// ============================================================
// 3. Підписування токена (auth сервіс)
// ============================================================

function signJwt(payload, privateKey, kid) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid,
  };

  console.log('📝 Header:');
  console.log(JSON.stringify(header, null, 2));

  console.log('\n📦 Payload:');
  console.log(JSON.stringify(payload, null, 2));

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();

  const signature = sign.sign(privateKey, 'base64url');
  const token = `${signingInput}.${signature}`;

  console.log('\n✍️  Signature (перші 40 символів):');
  console.log(signature.slice(0, 40) + '...');

  console.log('\n🎫 JWT токен:');
  console.log(token);
  console.log('\n' + '='.repeat(60) + '\n');

  return token;
}

// ============================================================
// 4. Верифікація токена (будь-який сервіс)
// ============================================================

function verifyJwt(token, publicKeysMap) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Декодуємо header щоб дістати kid
  const header = JSON.parse(base64UrlDecode(headerB64));
  const payload = JSON.parse(base64UrlDecode(payloadB64));

  console.log('🔍 Верифікація токена...\n');
  console.log('Декодований header:');
  console.log(JSON.stringify(header, null, 2));

  console.log('\nДекодований payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Знаходимо публічний ключ по kid
  const publicKey = publicKeysMap.get(header.kid);
  if (!publicKey) {
    throw new Error(`Unknown key id: ${header.kid}`);
  }
  console.log(`\n🗝️  Знайдено публічний ключ для kid: "${header.kid}"`);

  // Верифікуємо підпис
  const verify = createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  const isSignatureValid = verify.verify(publicKey, signatureB64, 'base64url');

  console.log(`\n✅ Підпис валідний: ${isSignatureValid}`);

  // Перевіряємо expiry
  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp < now;
  console.log(`⏰ Токен протухає: ${new Date(payload.exp * 1000).toISOString()}`);
  console.log(`⏰ Токен прострочений: ${isExpired}`);

  if (!isSignatureValid) throw new Error('Invalid signature');
  if (isExpired) throw new Error('Token expired');

  return payload;
}

// ============================================================
// 5. Демонстрація
// ============================================================

const kid = 'key-2025-02';
const now = Math.floor(Date.now() / 1000);

// Імітуємо JWKS кеш на стороні сервісу
const publicKeysMap = new Map([
  [kid, publicKey],
]);

// --- Успішний кейс ---
console.log('='.repeat(60));
console.log('КЕЙС 1: Нормальна аутентифікація');
console.log('='.repeat(60) + '\n');

const payload = {
  sub: 'a1b2c3d4-uuid',
  jti: 'unique-token-id-123',
  iat: now,
  exp: now + 3600,
  type: 'service',
  serviceName: 'payment-service',
  permissions: [
    'user-service:users:read',
    'auth-service:sessions:read',
  ],
};

const token = signJwt(payload, privateKey, kid);
const verified = verifyJwt(token, publicKeysMap);

console.log('\n🎉 Верифікація успішна! Permissions сервісу:');
console.log(verified.permissions);

// --- Підроблений токен ---
console.log('\n' + '='.repeat(60));
console.log('КЕЙС 2: Підроблений токен (змінили payload)');
console.log('='.repeat(60) + '\n');

const [h, , s] = token.split('.');
const fakePayload = base64UrlEncode(JSON.stringify({
  ...payload,
  permissions: ['user-service:users:delete'], // зловмисник додав permission
}));
const tamperedToken = `${h}.${fakePayload}.${s}`;

try {
  verifyJwt(tamperedToken, publicKeysMap);
} catch (e) {
  console.log(`\n🚫 Очікувана помилка: ${e.message}`);
}

// --- Протухлий токен ---
console.log('\n' + '='.repeat(60));
console.log('КЕЙС 3: Протухлий токен');
console.log('='.repeat(60) + '\n');

const expiredToken = signJwt(
  { ...payload, iat: now - 7200, exp: now - 3600 },
  privateKey,
  kid,
);

try {
  verifyJwt(expiredToken, publicKeysMap);
} catch (e) {
  console.log(`\n🚫 Очікувана помилка: ${e.message}`);
}

// --- Невідомий kid ---
console.log('\n' + '='.repeat(60));
console.log('КЕЙС 4: Токен підписаний невідомим ключем (після ротації)');
console.log('='.repeat(60) + '\n');

const unknownKidToken = signJwt(payload, privateKey, 'key-old-2024');

try {
  verifyJwt(unknownKidToken, publicKeysMap); // в кеші немає 'key-old-2024'
} catch (e) {
  console.log(`\n🚫 Очікувана помилка: ${e.message}`);
}