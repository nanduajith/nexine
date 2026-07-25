import { describe, expect, it } from 'vitest';

import { generateUuids, randomHex, uuidV4 } from './transform';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid', () => {
  it('produces a valid v4 UUID', () => {
    expect(uuidV4()).toMatch(UUID_V4);
  });

  it('generates the requested count and clamps the range', () => {
    expect(generateUuids(5)).toHaveLength(5);
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(1000)).toHaveLength(50);
  });

  it('produces unique values', () => {
    const set = new Set(generateUuids(20));
    expect(set.size).toBe(20);
  });

  it('generates hex of the expected length', () => {
    expect(randomHex(16)).toMatch(/^[0-9a-f]{32}$/);
  });
});
