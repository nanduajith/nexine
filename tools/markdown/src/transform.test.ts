import { describe, expect, it } from 'vitest';

import { parseMarkdown } from './transform';
describe('markdown', () => {
  it('works', () => {
    expect(parseMarkdown('# Hello')).toContain('<h1>Hello</h1>');
  });
});
