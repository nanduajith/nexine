import { describe, expect, it } from 'vitest';

import { minifyCss } from './transform';
describe('css-minifier', () => {
  it('works', () => {
    expect(minifyCss('.a { color: red; }')).toBe('.a{color:red}');
  });
});
