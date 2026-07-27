import { describe, expect, it } from 'vitest';

import { utf8ToBytes, bytesToUtf8, bytesToBase64, base64ToBytes, bytesToBase64Url } from './encoding';

describe('encoding', () => {
  it('converts utf8 to bytes and back', () => {
    const text = 'hello 🌍';
    const bytes = utf8ToBytes(text);
    expect(bytesToUtf8(bytes)).toBe(text);
  });

  it('converts bytes to base64 and back', () => {
    const bytes = new Uint8Array([1, 2, 3, 255]);
    const base64 = bytesToBase64(bytes);
    expect(base64ToBytes(base64)).toEqual(bytes);
  });

  it('converts bytes to base64url', () => {
    const bytes = new Uint8Array([251, 239, 255]);
    const url = bytesToBase64Url(bytes);
    expect(url).not.toContain('+');
    expect(url).not.toContain('/');
    expect(url).not.toContain('=');
  });

  it('base64 encoding chunks properly', () => {
    const large = new Uint8Array(40000);
    for (let i = 0; i < large.length; i++) large[i] = i % 256;
    const base64 = bytesToBase64(large);
    const decoded = base64ToBytes(base64);
    expect(decoded).toEqual(large);
  });
});
