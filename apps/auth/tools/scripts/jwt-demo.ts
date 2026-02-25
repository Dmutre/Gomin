import {
  createSign,
  createVerify,
  generateKeyPairSync,
  type KeyPairSyncResult,
} from 'crypto';

// ============================================================
// Types
// ============================================================

interface JwtHeader {
  alg: 'RS256';
  typ: 'JWT';
  kid: string;
}

interface ServiceTokenPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
  type: 'service';
  serviceName: string;
  permissions: string[];
}

type PublicKeysMap = Map<string, string>;

// ============================================================
// 1. Key generation (in production done once via openssl)
// ============================================================

console.log('🔑 Generating RSA key pair...\n');

const { privateKey, publicKey }: KeyPairSyncResult<string, string> =
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

console.log('Private key (first 60 chars):');
console.log(privateKey.slice(0, 60) + '...\n');

console.log('Public key (first 60 chars):');
console.log(publicKey.slice(0, 60) + '...\n');

// ============================================================
// 2. Helpers
// ============================================================

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

// ============================================================
// 3. Token signing (auth service)
// ============================================================

function signJwt(
  payload: ServiceTokenPayload,
  signingKey: string,
  kid: string,
): string {
  const header: JwtHeader = {
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

  // SHA256 hash of signingInput, then RSA encrypt with private key
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();

  const signature = sign.sign(signingKey, 'base64url');
  const token = `${signingInput}.${signature}`;

  console.log('\n✍️  Signature (first 40 chars):');
  console.log(signature.slice(0, 40) + '...');

  console.log('\n🎫 JWT token:');
  console.log(token);
  console.log('\n' + '='.repeat(60) + '\n');

  return token;
}

// ============================================================
// 4. Token verification (any service, no network call)
// ============================================================

function verifyJwt(
  token: string,
  publicKeysMap: PublicKeysMap,
): ServiceTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts as [
    string,
    string,
    string,
  ];

  // Decode header to extract kid
  const header = JSON.parse(base64UrlDecode(headerB64)) as JwtHeader;
  const payload = JSON.parse(
    base64UrlDecode(payloadB64),
  ) as ServiceTokenPayload;

  console.log('🔍 Verifying token...\n');
  console.log('Decoded header:');
  console.log(JSON.stringify(header, null, 2));

  console.log('\nDecoded payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Look up public key by kid from local JWKS cache
  const verifyingKey = publicKeysMap.get(header.kid);
  if (!verifyingKey) {
    throw new Error(`Unknown key id: ${header.kid}`);
  }
  console.log(`\n🗝️  Found public key for kid: "${header.kid}"`);

  // RSA decrypt signature with public key, compare hash with SHA256(header.payload)
  const verify = createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  const isSignatureValid = verify.verify(verifyingKey, signatureB64, 'base64url');

  console.log(`\n✅ Signature valid: ${isSignatureValid}`);

  const now = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp < now;
  console.log(`⏰ Token expires: ${new Date(payload.exp * 1000).toISOString()}`);
  console.log(`⏰ Token expired: ${isExpired}`);

  if (!isSignatureValid) throw new Error('Invalid token signature');
  if (isExpired) throw new Error('Token expired');

  return payload;
}

// ============================================================
// 5. Demo
// ============================================================

const kid = 'key-2025-02';
const now = Math.floor(Date.now() / 1000);

// Simulated JWKS cache on the receiving service side
const publicKeysMap: PublicKeysMap = new Map([[kid, publicKey]]);

const basePayload: ServiceTokenPayload = {
  sub: 'a1b2c3d4-uuid',
  jti: 'unique-token-id-123',
  iat: now,
  exp: now + 3600,
  type: 'service',
  serviceName: 'some-service',
  permissions: [
    'user-service:users:read',
    'auth-service:sessions:read',
  ],
};

// --- Case 1: Successful authentication ---
console.log('='.repeat(60));
console.log('CASE 1: Successful authentication');
console.log('='.repeat(60) + '\n');

const token = signJwt(basePayload, privateKey, kid);
const verified = verifyJwt(token, publicKeysMap);

console.log('\n🎉 Verification successful! Service permissions:');
console.log(verified.permissions);

// --- Case 2: Tampered token ---
console.log('\n' + '='.repeat(60));
console.log('CASE 2: Tampered token (payload modified)');
console.log('='.repeat(60) + '\n');

const [h, , s] = token.split('.') as [string, string, string];
const fakePayload = base64UrlEncode(
  JSON.stringify({
    ...basePayload,
    // attacker escalated their own permissions
    permissions: ['user-service:users:delete'],
  }),
);
const tamperedToken = `${h}.${fakePayload}.${s}`;

try {
  verifyJwt(tamperedToken, publicKeysMap);
} catch (e) {
  console.log(`\n🚫 Expected error: ${(e as Error).message}`);
}

// --- Case 3: Expired token ---
console.log('\n' + '='.repeat(60));
console.log('CASE 3: Expired token');
console.log('='.repeat(60) + '\n');

const expiredToken = signJwt(
  { ...basePayload, iat: now - 7200, exp: now - 3600 },
  privateKey,
  kid,
);

try {
  verifyJwt(expiredToken, publicKeysMap);
} catch (e) {
  console.log(`\n🚫 Expected error: ${(e as Error).message}`);
}

// --- Case 4: Unknown kid (e.g. after key rotation, cache not refreshed) ---
console.log('\n' + '='.repeat(60));
console.log('CASE 4: Token signed with unknown key id');
console.log('='.repeat(60) + '\n');

const unknownKidToken = signJwt(basePayload, privateKey, 'key-old-2024');

try {
  verifyJwt(unknownKidToken, publicKeysMap);
} catch (e) {
  console.log(`\n🚫 Expected error: ${(e as Error).message}`);
}
