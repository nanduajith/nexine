import { describe, expect, it } from 'vitest';

import { pxToRem, remToPx } from './transform';
describe('css-unit', () => {
  it('works', () => {
    expect(pxToRem('16', 16)).toBe('1rem');
    expect(remToPx('2', 16)).toBe('32px');
  });
});
