import { describe, expect, it } from 'vitest';

import { generateRsaKeys } from './transform';

describe('rsa-key', () => {
  it('generates a 1024-bit key pair', async () => {
    const { publicKey, privateKey } = await generateRsaKeys(1024);
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
  });
});
