import { describe, expect, it } from 'vitest';

import { parseMarkdown } from './transform';

describe('markdown', () => {
  it('returns empty string for empty input', () => {
    expect(parseMarkdown('')).toBe('');
  });
  it('works', () => {
    expect(parseMarkdown('# Hello').trim()).toBe('<h1>Hello</h1>');
  });
});