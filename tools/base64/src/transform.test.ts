import { describe, expect, it } from 'vitest';

import { decodeBase64, encodeBase64 } from './transform';

describe('base64', () => {
  it('round-trips ASCII', () => {
    const encoded = encodeBase64('hello');
    expect(encoded).toBe('aGVsbG8=');
    const decoded = decodeBase64(encoded);
    expect(decoded).toEqual({ ok: true, value: 'hello' });
  });

  it('round-trips Unicode (emoji, accents)', () => {
    const text = 'café — 🚀 日本語';
    const decoded = decodeBase64(encodeBase64(text));
    expect(decoded).toEqual({ ok: true, value: text });
  });

  it('supports URL-safe encoding without padding', () => {
    const encoded = encodeBase64('<<???>>', true);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    // URL-safe output still decodes correctly.
    expect(decodeBase64(encoded)).toEqual({ ok: true, value: '<<???>>' });
  });

  it('reports invalid input as an error', () => {
    const result = decodeBase64('%%%not-base64%%%');
    expect(result.ok).toBe(false);
  });

  it('treats empty input as empty output', () => {
    expect(decodeBase64('   ')).toEqual({ ok: true, value: '' });
  });
});
