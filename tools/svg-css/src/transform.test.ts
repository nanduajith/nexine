import { describe, expect, it } from 'vitest';

import { svgToCss } from './transform';
describe('svg-css', () => {
  it('works', () => {
    expect(svgToCss('<svg></svg>')).toContain('background-image:');
  });
});
