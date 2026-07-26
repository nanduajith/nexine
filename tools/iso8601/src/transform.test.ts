import { describe, expect, it } from 'vitest';

import { parseIso } from './transform';
describe('iso', () => {
  it('works', () => {
    expect(parseIso('2024-01-01').timestamp).toBeDefined();
  });
});
