import { describe, expect, it } from 'vitest';

import { generateNanoId } from './transform';
describe('nanoid', () => {
  it('works', () => {
    expect(generateNanoId()).toHaveLength(21);
  });
});
