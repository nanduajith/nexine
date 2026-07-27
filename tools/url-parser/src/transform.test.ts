import { describe, expect, it } from 'vitest';

import { parseUrl } from './transform';

describe('url-parser transform', () => {
  it('parseUrl works for valid URL', () => {
    const res = parseUrl('https://user:pass@example.com:8080/path?q=1#hash');
    expect(res.href).toBe('https://user:pass@example.com:8080/path?q=1#hash');
    expect(res.protocol).toBe('https:');
    expect(res.host).toBe('example.com:8080');
    expect(res.hostname).toBe('example.com');
    expect(res.port).toBe('8080');
    expect(res.pathname).toBe('/path');
    expect(res.search).toBe('?q=1');
    expect(res.hash).toBe('#hash');
    expect(res.username).toBe('user');
    expect(res.password).toBe('pass');
    expect(res.q).toBe('1');
  });
  
  it('parseUrl handles invalid url', () => {
    const res = parseUrl('not a valid url');
    expect(res.error).toBe('Invalid URL');
  });
});