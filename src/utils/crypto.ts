/**
 * AES-GCM 256-bit client-side local encryption utility.
 * Encrypts sensitive user data (schedules, target temperatures, Telegram tokens, and config)
 * using Web Crypto API / Node.js native crypto with PBKDF2 derived keys.
 */

const DEFAULT_SALT = 'kombi-akilli-termostat-salt-2026';
const VAULT_ITERATIONS = 100000;

export interface EncryptedPayload {
  version: number;
  iv: string; // base64
  salt: string; // base64
  ciphertext: string; // base64
  timestamp: string;
}

// Convert ArrayBuffer / Uint8Array to base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Get crypto instance safely
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) is not supported in this environment');
}

/**
 * Derive an AES-GCM key from a user passphrase or device master seed using PBKDF2
 */
export async function deriveKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passBuffer = encoder.encode(passphrase);

  const baseKey = await subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: VAULT_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an object or string into an EncryptedPayload
 */
export async function encryptData(data: unknown, passphrase = DEFAULT_SALT): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();
  const jsonStr = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plainBytes = encoder.encode(jsonStr);

  // Generate 16 bytes salt and 12 bytes IV (standard for AES-GCM)
  const saltBytes = new Uint8Array(16);
  const ivBytes = new Uint8Array(12);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  cryptoObj.getRandomValues(saltBytes);
  cryptoObj.getRandomValues(ivBytes);

  const key = await deriveKey(passphrase, saltBytes);

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    plainBytes
  );

  return {
    version: 1,
    iv: bufferToBase64(ivBytes),
    salt: bufferToBase64(saltBytes),
    ciphertext: bufferToBase64(cipherBuffer),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypt an EncryptedPayload back into the original object
 */
export async function decryptData<T = unknown>(payload: EncryptedPayload, passphrase = DEFAULT_SALT): Promise<T> {
  const subtle = getSubtleCrypto();
  const ivBytes = base64ToBuffer(payload.iv);
  const saltBytes = base64ToBuffer(payload.salt);
  const cipherBytes = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, saltBytes);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    cipherBytes as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Encrypted localStorage Storage Wrapper
 */
export const SecureVault = {
  async setItem(key: string, data: unknown, passphrase = DEFAULT_SALT): Promise<void> {
    try {
      const encrypted = await encryptData(data, passphrase);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`sec_${key}`, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.warn('SecureVault.setItem failed:', e);
    }
  },

  async getItem<T>(key: string, fallback: T, passphrase = DEFAULT_SALT): Promise<T> {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(`sec_${key}`);
      if (!raw) return fallback;
      const payload = JSON.parse(raw) as EncryptedPayload;
      if (!payload.ciphertext || !payload.iv) return fallback;
      return await decryptData<T>(payload, passphrase);
    } catch {
      return fallback;
    }
  },

  hasKey(key: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem(`sec_${key}`);
  },

  removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`sec_${key}`);
    }
  }
};
