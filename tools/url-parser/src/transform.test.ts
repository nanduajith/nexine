import { describe, expect, it } from 'vitest';

import { parseUrl } from './transform';
describe('url-parser', () => {
  it('works', () => {
    expect(parseUrl('https://ex.com/a?b=c').hostname).toBe('ex.com');
  });
});
