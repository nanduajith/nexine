import { describe, expect, it } from 'vitest';

import { sortText } from './transform';
describe('sorter', () => {
  it('works', () => {
    expect(sortText('b\na', false, false)).toBe('a\nb');
  });
});
