import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from './transform';

describe('aes', () => {
  it('encrypts and decrypts text', async () => {
    const original = 'super secret data!';
    const pass = 'hunter2';

    const enc = await encrypt(original, pass);
    expect(enc).not.toBe(original);

    const dec = await decrypt(enc, pass);
    expect(dec).toBe(original);
  });

  it('fails with wrong passphrase', async () => {
    const enc = await encrypt('test', 'right');
    await expect(decrypt(enc, 'wrong')).rejects.toThrow();
  });
});
