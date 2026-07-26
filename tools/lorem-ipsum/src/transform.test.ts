import { describe, expect, it } from 'vitest';

import { generateLorem } from './transform';
describe('lorem', () => {
  it('works', () => {
    expect(generateLorem(1, 'words').length).toBeGreaterThan(0);
  });
});
