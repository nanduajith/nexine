import { describe, expect, it } from 'vitest';

import { generateKeyPair, keyIdFromPublicKey, sign, verify } from './crypto';

describe('crypto', () => {
  it('generates a key pair and signs/verifies a message', async () => {
    const keys = await generateKeyPair();
    expect(keys.publicKey).toBeDefined();
    expect(keys.privateKey).toBeDefined();
    expect(keys.keyId).toBeDefined();
    
    const message = new Uint8Array([1, 2, 3]);
    const signature = await sign(message, keys.privateKey);
    const isValid = await verify(message, signature, keys.publicKey);
    expect(isValid).toBe(true);
    
    const isInvalid = await verify(message, signature, 'invalid-key');
    expect(isInvalid).toBe(false);
  });

  it('throws if crypto.subtle is not available', async () => {
    const originalCrypto = (globalThis as any).crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, writable: true });
    await expect(generateKeyPair()).rejects.toThrow('WebCrypto');
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, writable: true });
  });

  it('keyIdFromPublicKey creates consistent id', async () => {
    const keys = await generateKeyPair();
    const id = await keyIdFromPublicKey(keys.publicKey);
    expect(id).toBe(keys.keyId);
  });
});
