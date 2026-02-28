import { createVerify } from 'crypto';

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

export interface JwtVerifyResult {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export class JwtVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtVerificationError';
  }
}

export function verifyJwtRs256(
  token: string,
  publicKey: string,
): JwtVerifyResult {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new JwtVerificationError('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts as [
    string,
    string,
    string,
  ];

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;

  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8')) as Record<
      string,
      unknown
    >;
    payload = JSON.parse(
      base64UrlDecode(payloadB64).toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    throw new JwtVerificationError('Invalid JWT encoding');
  }

  const verify = createVerify('RSA-SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  verify.end();

  const isValid = verify.verify(publicKey, base64UrlDecode(signatureB64));
  if (!isValid) {
    throw new JwtVerificationError('Invalid JWT signature');
  }

  return { header, payload };
}
