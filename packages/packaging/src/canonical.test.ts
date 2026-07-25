import { describe, expect, it } from 'vitest';

import { CanonicalizationError, canonicalJson } from './canonical';

describe('canonicalJson', () => {
  it('is independent of object key insertion order', () => {
    const a = canonicalJson({ b: 1, a: 2, c: { y: 1, x: 2 } });
    const b = canonicalJson({ c: { x: 2, y: 1 }, a: 2, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"b":1,"c":{"x":2,"y":1}}');
  });

  it('preserves array order (arrays are ordered)', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
  });

  it('drops undefined members so absent and undefined serialize identically', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });

  it('rejects non-finite numbers', () => {
    expect(() => canonicalJson({ n: Number.POSITIVE_INFINITY })).toThrow(CanonicalizationError);
    expect(() => canonicalJson({ n: Number.NaN })).toThrow(CanonicalizationError);
  });

  it('rejects functions', () => {
    expect(() => canonicalJson({ f: () => 1 })).toThrow(CanonicalizationError);
  });

  it('escapes strings via JSON semantics', () => {
    expect(canonicalJson({ s: 'a"b\n' })).toBe('{"s":"a\\"b\\n"}');
  });
});
