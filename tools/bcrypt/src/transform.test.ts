import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';

import { hash, verify } from './transform';

describe('bcrypt transform', () => {
  describe('hash', () => {
    it('hashes a password and returns a string starting with $2', () => {
      const pwd = 'mySecretPassword';
      const h = hash(pwd, 4);
      expect(h.startsWith('$2')).toBe(true);
      expect(h).not.toEqual(pwd);
    });

    it('returns empty string if password is falsy or empty', () => {
      expect(hash('')).toBe('');
    });

    it('uses default rounds if not provided', () => {
      const h = hash('password');
      expect(h.startsWith('$2')).toBe(true);
    });
  });

  describe('verify', () => {
    it('returns true for correct password and hash', () => {
      const pwd = 'mySecretPassword';
      const h = hash(pwd, 4);
      expect(verify(pwd, h)).toBe(true);
    });

    it('returns false for wrong password', () => {
      const pwd = 'mySecretPassword';
      const h = hash(pwd, 4);
      expect(verify('wrong', h)).toBe(false);
    });

    it('returns false if password is empty or falsy', () => {
      const h = hash('password', 4);
      expect(verify('', h)).toBe(false);
    });

    it('returns false if hash is empty or falsy', () => {
      expect(verify('password', '')).toBe(false);
    });

    it('returns false and catches error if compareSync throws', () => {
      const spy = vi.spyOn(bcrypt, 'compareSync').mockImplementationOnce(() => {
        throw new Error('mock error');
      });
      expect(verify('password', 'anyhash')).toBe(false);
      spy.mockRestore();
    });
  });
});
