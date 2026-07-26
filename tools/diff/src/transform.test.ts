import { describe, expect, it } from 'vitest';

import { diffLines } from './transform';

const ops = (left: string, right: string, opts = {}) =>
  diffLines(left, right, opts).lines.map((l) => `${l.op}:${l.text}`);

describe('diffLines', () => {
  it('reports identical input as all-equal', () => {
    const r = diffLines('a\nb\nc', 'a\nb\nc');
    expect(r.identical).toBe(true);
    expect(r.summary).toEqual({ added: 0, removed: 0, unchanged: 3 });
  });

  it('detects an added line', () => {
    expect(ops('a\nc', 'a\nb\nc')).toEqual(['equal:a', 'add:b', 'equal:c']);
  });

  it('detects a removed line', () => {
    expect(ops('a\nb\nc', 'a\nc')).toEqual(['equal:a', 'remove:b', 'equal:c']);
  });

  it('detects a changed line as remove + add', () => {
    const r = diffLines('hello\nworld', 'hello\nthere');
    expect(r.lines.map((l) => l.op)).toEqual(['equal', 'remove', 'add']);
    expect(r.summary).toEqual({ added: 1, removed: 1, unchanged: 1 });
  });

  it('tracks line numbers on each side', () => {
    const r = diffLines('a\nc', 'a\nb\nc');
    expect(r.lines).toEqual([
      { op: 'equal', leftNumber: 1, rightNumber: 1, text: 'a' },
      { op: 'add', leftNumber: null, rightNumber: 2, text: 'b' },
      { op: 'equal', leftNumber: 2, rightNumber: 3, text: 'c' },
    ]);
  });

  it('normalizes CRLF and a trailing newline', () => {
    const r = diffLines('a\r\nb\r\n', 'a\nb');
    expect(r.identical).toBe(true);
  });

  it('honors trimWhitespace and ignoreCase', () => {
    expect(diffLines('  a  ', 'a', { trimWhitespace: true }).identical).toBe(true);
    expect(diffLines('Hello', 'hello', { ignoreCase: true }).identical).toBe(true);
    expect(diffLines('Hello', 'hello').identical).toBe(false);
  });

  it('handles empty inputs', () => {
    expect(diffLines('', '').summary).toEqual({ added: 0, removed: 0, unchanged: 0 });
    expect(ops('', 'a\nb')).toEqual(['add:a', 'add:b']);
    expect(ops('a\nb', '')).toEqual(['remove:a', 'remove:b']);
  });
});
