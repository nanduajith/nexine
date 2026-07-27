import { describe, expect, it } from 'vitest';

import { minifyCss } from './transform';

describe('css-minifier transform', () => {
  it('minifyCss works', () => {
    const css = 'body { color: red; }';
    const minified = minifyCss(css);
    expect(minified).toBe('body{color:red}');
  });
  it('minifyCss returns empty on empty input', () => {
    expect(minifyCss('')).toBe('');
  });
});