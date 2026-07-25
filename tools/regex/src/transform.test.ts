import { describe, expect, it } from 'vitest';

import { runRegex } from './transform';

describe('regex', () => {
  it('finds all matches', () => {
    const result = runRegex('\\d+', '', 'a1 b22 c333');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.map((m) => m.match)).toEqual(['1', '22', '333']);
  });

  it('captures groups', () => {
    const result = runRegex('(\\w)(\\d)', '', 'a1 b2');
    if (result.ok) {
      expect(result.value[0]?.groups).toEqual(['a', '1']);
      expect(result.value[1]?.groups).toEqual(['b', '2']);
    }
  });

  it('honors flags (case-insensitive)', () => {
    const result = runRegex('foo', 'i', 'FOO foo Foo');
    if (result.ok) expect(result.value).toHaveLength(3);
  });

  it('reports invalid patterns as errors', () => {
    expect(runRegex('(unclosed', '', 'x').ok).toBe(false);
  });

  it('returns no matches for an empty pattern', () => {
    expect(runRegex('', '', 'anything')).toEqual({ ok: true, value: [] });
  });
});
