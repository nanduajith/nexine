import { describe, expect, it } from 'vitest';

import { generateFakeData } from './transform';
describe('fake-data', () => {
  it('works', () => {
    expect(generateFakeData('person').length).toBeGreaterThan(0);
  });
});
