import { describe, expect, it } from 'vitest';

import { generateRandomBytes } from './transform';
describe('random-bytes', () => {
  it('works', () => {
    expect(generateRandomBytes(16, 'hex')).toHaveLength(32);
  });
});
