import { describe, it, expect } from 'vitest';

import { generateNanoId } from './transform';
describe('nanoid', () => {
  it('default', () => expect(generateNanoId()).toHaveLength(21));
  it('custom size', () => expect(generateNanoId(10)).toHaveLength(10));
});