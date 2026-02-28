import { createVerify } from 'crypto';

function base64UrlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  const padded = padding ? base64 + '='.repeat(4 - padding) : base64;
  return Buffer.from(padded, 'base64');
}

export function verifyJwtRs256(
  token: string,
  publicKey: string,
): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  const header = JSON.parse(
    base64UrlDecode(headerB64).toString('utf8'),
  ) as Record<string, unknown>;
  const payload = JSON.parse(
    base64UrlDecode(payloadB64).toString('utf8'),
  ) as Record<string, unknown>;

  const verify = createVerify('RSA-SHA256');
  verify.update(signingInput);
  verify.end();

  const signature = base64UrlDecode(signatureB64);
  if (!verify.verify(publicKey, signature)) {
    throw new Error('Invalid JWT signature');
  }

  const exp = payload['exp'] as number | undefined;
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return { header, payload };
}
