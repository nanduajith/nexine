import { describe, expect, it } from 'vitest';

import { decodeHtml, encodeHtml } from './transform';

describe('html-entities', () => {
  it('encodes the unsafe characters', () => {
    expect(encodeHtml(`<a href="x">& '`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp; &#39;');
  });

  it('round-trips encode → decode', () => {
    const text = `if (a < b && c > "d") { return 'e'; }`;
    expect(decodeHtml(encodeHtml(text))).toBe(text);
  });

  it('decodes named, decimal, and hex entities', () => {
    expect(decodeHtml('&amp;')).toBe('&');
    expect(decodeHtml('&#65;')).toBe('A');
    expect(decodeHtml('&#x41;')).toBe('A');
  });

  it('leaves unknown entities untouched', () => {
    expect(decodeHtml('&notreal;')).toBe('&notreal;');
  });
});
