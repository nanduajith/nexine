import { describe, expect, it } from 'vitest';

import { formatJson, minifyJson } from './transform';

describe('json', () => {
  it('formats with 2-space indent by default', () => {
    expect(formatJson('{"a":1}')).toEqual({ ok: true, value: '{\n  "a": 1\n}' });
  });

  it('formats with tabs when requested', () => {
    expect(formatJson('{"a":1}', '\t')).toEqual({ ok: true, value: '{\n\t"a": 1\n}' });
  });

  it('minifies', () => {
    expect(minifyJson('{\n  "a":  1\n}')).toEqual({ ok: true, value: '{"a":1}' });
  });

  it('reports a parse error message', () => {
    const result = formatJson('{ bad }');
    expect(result.ok).toBe(false);
  });

  it('passes empty input through', () => {
    expect(formatJson('  ')).toEqual({ ok: true, value: '' });
  });
});
