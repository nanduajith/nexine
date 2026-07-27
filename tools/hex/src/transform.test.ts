import { describe, expect, it } from 'vitest';

import { hexToText, textToHex } from './transform';

describe('hex', () => {
  it('encodes ASCII', () => {
    expect(textToHex('Hi', '')).toBe('4869');
    expect(textToHex('Hi')).toBe('48 69');
  });
  it('round-trips Unicode', () => {
    const text = 'café 🚀';
    expect(hexToText(textToHex(text))).toEqual({ ok: true, value: text });
  });
  it('tolerates 0x prefixes and separators', () => {
    expect(hexToText('0x48, 0x69')).toEqual({ ok: true, value: 'Hi' });
    expect(hexToText('48:69')).toEqual({ ok: true, value: 'Hi' });
    expect(hexToText('0x 48_69')).toEqual({ ok: true, value: 'Hi' });
  });
  it('rejects odd-length and non-hex input', () => {
    expect(hexToText('486').ok).toBe(false);
    expect(hexToText('zz').ok).toBe(false);
  });
  it('handles empty input', () => {
    expect(textToHex('')).toBe('');
    expect(hexToText('')).toEqual({ ok: true, value: '' });
    expect(hexToText('   ')).toEqual({ ok: true, value: '' });
  });
});