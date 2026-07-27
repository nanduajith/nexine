import { describe, expect, it } from 'vitest';

import { getCategory } from './categories';


describe('getCategory', () => {
  it('returns the category if it exists', () => {
    const category = getCategory('encoding');
    expect(category.label).toBe('Encoding');
  });

  it('throws an error if the category is unknown', () => {
    // Cast to any to bypass TS type check for invalid category
    expect(() => getCategory('invalid-category' as any)).toThrowError(/Unknown tool category/);
  });
});
