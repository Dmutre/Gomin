import { b64ToBytes, bytesToB64 } from './utils';
import type { E2eeKeys, MessagePayload } from '../types';

// ── Key Generation ──────────────────────────────────────────────────────────

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function wrapPrivateKey(
  keyPair: CryptoKeyPair,
  password: string,
): Promise<E2eeKeys & { publicKey: string }> {
  const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const wrapKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrapKey,
    privateKeyPkcs8,
  );

  const encArr = new Uint8Array(encryptedBuf);
  // AES-GCM appends 16-byte auth tag at end
  const encryptedPrivateKey = bytesToB64(encArr.slice(0, -16));
  const encryptionAuthTag = bytesToB64(encArr.slice(-16));
  const encryptionSalt = bytesToB64(salt);
  const encryptionIv = bytesToB64(iv);
  const publicKey = bytesToB64(new Uint8Array(publicKeySpki));

  return {
    publicKey,
    encryptedPrivateKey,
    encryptionSalt,
    encryptionIv,
    encryptionAuthTag,
  };
}

export async function unwrapPrivateKey(
  e2eeKeys: E2eeKeys,
  password: string,
): Promise<CryptoKey> {
  const salt = b64ToBytes(e2eeKeys.encryptionSalt);
  const iv = b64ToBytes(e2eeKeys.encryptionIv);
  const ciphertext = b64ToBytes(e2eeKeys.encryptedPrivateKey);
  const authTag = b64ToBytes(e2eeKeys.encryptionAuthTag);
  const combined = new Uint8Array([...ciphertext, ...authTag]);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const wrapKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const privateKeyBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrapKey, combined);

  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuf,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
}

// ── Message Encryption (Direct / per-message) ───────────────────────────────

export async function encryptMessage(plaintext: string): Promise<{
  payload: Omit<MessagePayload, 'keyVersion' | 'iteration'>;
  rawKey: Uint8Array;
}> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const msgKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, [
    'encrypt',
  ]);
  const msgIv = crypto.getRandomValues(new Uint8Array(12));
  const encBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: msgIv },
    msgKey,
    new TextEncoder().encode(plaintext),
  );

  const encArr = new Uint8Array(encBuf);
  return {
    payload: {
      encryptedContent: bytesToB64(encArr.slice(0, -16)),
      iv: bytesToB64(msgIv),
      authTag: bytesToB64(encArr.slice(-16)),
    },
    rawKey,
  };
}

export async function decryptMessage(
  payload: MessagePayload,
  rawKey: Uint8Array,
): Promise<string> {
  const encryptedBytes = b64ToBytes(payload.encryptedContent);
  const authTagBytes = b64ToBytes(payload.authTag);
  const combined = new Uint8Array([...encryptedBytes, ...authTagBytes]);
  const iv = b64ToBytes(payload.iv);

  const msgKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, msgKey, combined);
  return new TextDecoder().decode(decrypted);
}

// ── Sender Key Chain (Group) ─────────────────────────────────────────────────

export function generateChainKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function deriveMessageKeyFromChain(
  chainKey: Uint8Array,
  iteration: number,
): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    chainKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const iterBytes = new Uint8Array(4);
  new DataView(iterBytes.buffer).setUint32(0, iteration, false);
  const data = new Uint8Array([...new TextEncoder().encode('msg'), ...iterBytes]);
  const msgKeyBytes = new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, data));
  return msgKeyBytes;
}

export async function advanceChainKey(chainKey: Uint8Array): Promise<Uint8Array> {
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    chainKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, new Uint8Array([0x02])));
}

export async function encryptChainKeyForRecipient(
  chainKey: Uint8Array,
  recipientPublicKeyB64: string,
): Promise<string> {
  const spki = b64ToBytes(recipientPublicKeyB64);
  const pubKey = await crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, chainKey);
  return bytesToB64(new Uint8Array(encrypted));
}

export async function decryptChainKey(
  encryptedB64: string,
  privateKey: CryptoKey,
): Promise<Uint8Array> {
  const encrypted = b64ToBytes(encryptedB64);
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encrypted);
  return new Uint8Array(decrypted);
}

export async function encryptWithChainKey(
  plaintext: string,
  chainKey: Uint8Array,
  iteration: number,
): Promise<MessagePayload> {
  const msgKeyBytes = await deriveMessageKeyFromChain(chainKey, iteration);
  const msgKey = await crypto.subtle.importKey('raw', msgKeyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    msgKey,
    new TextEncoder().encode(plaintext),
  );
  const encArr = new Uint8Array(encBuf);
  return {
    encryptedContent: bytesToB64(encArr.slice(0, -16)),
    iv: bytesToB64(iv),
    authTag: bytesToB64(encArr.slice(-16)),
    keyVersion: 1,
    iteration,
  };
}

export async function decryptWithChainKey(
  payload: MessagePayload,
  chainKey: Uint8Array,
): Promise<string> {
  const msgKeyBytes = await deriveMessageKeyFromChain(chainKey, payload.iteration);
  const msgKey = await crypto.subtle.importKey('raw', msgKeyBytes, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);
  const encryptedBytes = b64ToBytes(payload.encryptedContent);
  const authTagBytes = b64ToBytes(payload.authTag);
  const combined = new Uint8Array([...encryptedBytes, ...authTagBytes]);
  const iv = b64ToBytes(payload.iv);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, msgKey, combined);
  return new TextDecoder().decode(decrypted);
}
