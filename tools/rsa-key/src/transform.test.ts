import { describe, expect, it } from 'vitest';

import { generateRsaKeys } from './transform';

describe('rsa-key', () => {
  it('generates a 1024-bit key pair', async () => {
    const { publicKey, privateKey } = await generateRsaKeys(1024);
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN ' + 'PRIVATE KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
    expect(privateKey).toContain('-----END ' + 'PRIVATE KEY-----');
  });

  it('generates a 2048-bit key pair', async () => {
    const { publicKey, privateKey } = await generateRsaKeys(2048);
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN ' + 'PRIVATE KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
    expect(privateKey).toContain('-----END ' + 'PRIVATE KEY-----');
  });

  it('generates a 4096-bit key pair', async () => {
    const { publicKey, privateKey } = await generateRsaKeys(4096);
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN ' + 'PRIVATE KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
    expect(privateKey).toContain('-----END ' + 'PRIVATE KEY-----');
  });

  it('formats PEM with max 64-character lines', async () => {
    const { publicKey, privateKey } = await generateRsaKeys(1024);
    
    const checkPemFormat = (pem: string, type: string) => {
      const lines = pem.split('\n');
      expect(lines[0]).toBe(`-----BEGIN ${type}-----`);
      expect(lines[lines.length - 1]).toBe(`-----END ${type}-----`);
      
      for (let i = 1; i < lines.length - 1; i++) {
        expect(lines[i]?.length).toBeLessThanOrEqual(64);
        if (i < lines.length - 2) {
          expect(lines[i]?.length).toBe(64);
        }
      }
    };

    checkPemFormat(publicKey, 'PUBLIC KEY');
    checkPemFormat(privateKey, 'PRIVATE KEY');
  });

  it('rejects when an invalid length is provided', async () => {
    // @ts-expect-error Testing invalid input for robustness
    await expect(generateRsaKeys(123)).rejects.toThrow();
  });
});