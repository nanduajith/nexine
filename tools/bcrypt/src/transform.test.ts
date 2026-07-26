import { describe, expect, it } from 'vitest';

import { hash, verify } from './transform';

describe('bcrypt', () => {
  it('hashes a password and verifies it', () => {
    const pwd = 'mySecretPassword';
    const h = hash(pwd, 4);
    expect(h.startsWith('$2')).toBe(true);
    expect(verify(pwd, h)).toBe(true);
    expect(verify('wrong', h)).toBe(false);
  });
});
