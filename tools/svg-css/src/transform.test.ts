import { describe, expect, it } from 'vitest';

import { svgToCss } from './transform';
describe('svg-css', () => {
  it('works', () => expect(svgToCss('<svg id="a" class=\'b\'></svg>')).toContain('background-image:'));
  it('empty', () => expect(svgToCss('')).toBe(''));
});