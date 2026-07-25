import { describe, expect, it } from 'vitest';

import { hashText } from './transform';

describe('hash', () => {
  it('computes the known SHA-256 of "abc"', async () => {
    expect(await hashText('abc', 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes the known SHA-1 of "abc"', async () => {
    expect(await hashText('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('produces the expected digest length for SHA-512 (128 hex chars)', async () => {
    expect(await hashText('', 'SHA-512')).toHaveLength(128);
  });
});
