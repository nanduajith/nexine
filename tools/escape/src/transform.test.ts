import { describe, expect, it } from 'vitest';

import { escapeStr } from './transform';
describe('escape', () => {
  it('works', () => {
    expect(escapeStr('\n')).toBe('\\n');
  });
});
