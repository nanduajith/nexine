import { describe, expect, it } from 'vitest';

import { sortText } from './transform';

describe('sorter', () => {
  it('returns empty string for empty input', () => {
    expect(sortText('', false, false)).toBe('');
  });
  it('sorts alphabetically', () => {
    expect(sortText('b\na\nc', false, false)).toBe('a\nb\nc');
  });
  it('sorts in reverse', () => {
    expect(sortText('b\na\nc', true, false)).toBe('c\nb\na');
  });
  it('deduplicates lines', () => {
    expect(sortText('a\nb\na', false, true)).toBe('a\nb');
  });
});