import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from './transform';

describe('aes transform', () => {
  describe('encrypt', () => {
    it('encrypts text with a passphrase', async () => {
      const original = 'super secret data!';
      const pass = 'hunter2';

      const enc = await encrypt(original, pass);
      expect(enc).not.toBe(original);
      expect(enc).toBeTruthy();
      expect(typeof enc).toBe('string');
    });

    it('returns empty string if text is empty', async () => {
      expect(await encrypt('', 'pass')).toBe('');
    });

    it('returns empty string if passphrase is empty', async () => {
      expect(await encrypt('text', '')).toBe('');
    });

    it('returns empty string if both are empty', async () => {
      expect(await encrypt('', '')).toBe('');
    });
  });

  describe('decrypt', () => {
    it('decrypts encrypted text with the correct passphrase', async () => {
      const original = 'super secret data!';
      const pass = 'hunter2';

      const enc = await encrypt(original, pass);
      const dec = await decrypt(enc, pass);
      expect(dec).toBe(original);
    });

    it('fails with wrong passphrase', async () => {
      const enc = await encrypt('test', 'right');
      await expect(decrypt(enc, 'wrong')).rejects.toThrow('Decryption failed. Incorrect passphrase or corrupt data.');
    });

    it('returns empty string if ciphertext is empty', async () => {
      expect(await decrypt('', 'pass')).toBe('');
    });

    it('returns empty string if passphrase is empty', async () => {
      expect(await decrypt('ciphertext', '')).toBe('');
    });

    it('fails with invalid base64 string', async () => {
      await expect(decrypt('invalid_base64!!!', 'pass')).rejects.toThrow('Decryption failed. Incorrect passphrase or corrupt data.');
    });

    it('fails if combined length is less than 12', async () => {
      const shortCiphertext = btoa(String.fromCharCode(...new Uint8Array(11)));
      await expect(decrypt(shortCiphertext, 'pass')).rejects.toThrow('Decryption failed. Incorrect passphrase or corrupt data.');
    });

    it('fails if data is corrupted but valid length', async () => {
      const enc = await encrypt('test', 'pass');
      const corrupted = enc.slice(0, -1) + (enc.endsWith('a') ? 'b' : 'a');
      await expect(decrypt(corrupted, 'pass')).rejects.toThrow('Decryption failed. Incorrect passphrase or corrupt data.');
    });
  });
});
