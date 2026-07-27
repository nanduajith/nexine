import { describe, it, expect } from 'vitest';

import { generateUlid } from './transform';
describe('ulid', () => {
  it('works', () => expect(generateUlid()).toHaveLength(26));
});