import { describe, expect, it } from 'vitest';

import { generatePlaceholder } from './transform';
describe('img', () => {
  it('works', () => {
    expect(generatePlaceholder(100, 100, 'A', '#000', '#fff')).toContain('data:image');
  });
});
