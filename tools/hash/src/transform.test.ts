import { describe, expect, it } from 'vitest';

import { HASH_ALGORITHMS, WEAK_ALGORITHMS, hashText, hashAll } from './transform';

describe('transform', () => {
  describe('HASH_ALGORITHMS', () => {
    it('contains all supported algorithms', () => {
      expect(HASH_ALGORITHMS).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
    });
  });

  describe('WEAK_ALGORITHMS', () => {
    it('contains only SHA-1', () => {
      expect(Array.from(WEAK_ALGORITHMS)).toEqual(['SHA-1']);
    });
  });

  describe('hashText', () => {
    it('computes the known SHA-1 of "abc"', async () => {
      expect(await hashText('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    });

    it('computes the known SHA-256 of "abc"', async () => {
      expect(await hashText('abc', 'SHA-256')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      );
    });

    it('computes the known SHA-384 of "abc"', async () => {
      expect(await hashText('abc', 'SHA-384')).toBe(
        'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
      );
    });

    it('computes the known SHA-512 of "abc"', async () => {
      expect(await hashText('abc', 'SHA-512')).toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      );
    });

    it('handles empty strings', async () => {
      expect(await hashText('', 'SHA-256')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });

    it('handles UTF-8 characters', async () => {
      expect(await hashText('你好', 'SHA-256')).toBe(
        '670d9743542cae3ea7ebe36af56bd53648b0a1126162e78d81a32934a711302e',
      );
    });
    
    it('handles errors gracefully by throwing', async () => {
      // Vitest's crypto might throw on unsupported algorithms
      await expect(hashText('abc', 'UNSUPPORTED' as any)).rejects.toThrow();
    });
  });

  describe('hashAll', () => {
    it('computes all hashes in parallel', async () => {
      const results = await hashAll('abc');
      expect(results['SHA-1']).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
      expect(results['SHA-256']).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(results['SHA-384']).toBe('cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7');
      expect(results['SHA-512']).toBe('ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
    });
  });
});
