import { describe, expect, it } from 'vitest';

import { decodeUrl, encodeUrl, parseQuery } from './transform';

describe('url', () => {
  it('encodes and decodes a component round-trip', () => {
    const raw = 'a b&c=d/e?f';
    const encoded = encodeUrl(raw);
    expect(encoded).toBe('a%20b%26c%3Dd%2Fe%3Ff');
    expect(decodeUrl(encoded)).toEqual({ ok: true, value: raw });
  });

  it('reports malformed percent-encoding', () => {
    expect(decodeUrl('%E0%A4%A').ok).toBe(false);
  });

  it('parses query parameters from a full URL', () => {
    expect(parseQuery('https://x.dev/path?a=1&b=two+words')).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: 'two words' },
    ]);
  });

  it('returns no params for empty input', () => {
    expect(parseQuery('   ')).toEqual([]);
  });
});
