import { describe, expect, it } from 'vitest';

import { lookupMime } from './transform';
describe('mime', () => {
  it('works', () => {
    expect(lookupMime('json')).toBe('application/json');
    expect(lookupMime('application/json')).toBe('json');
  });
});
