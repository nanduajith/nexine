import { describe, expect, it } from 'vitest';

import { generateLorem } from './transform';

describe('lorem', () => {
  it('generates paragraphs', () => {
    expect(generateLorem(2, 'paragraphs').split('\n').length).toBeGreaterThan(1);
  });
  it('generates sentences', () => {
    expect(generateLorem(3, 'sentences')).toBeTruthy();
  });
  it('generates words', () => {
    expect(generateLorem(5, 'words').split(' ').length).toBe(5);
  });
});