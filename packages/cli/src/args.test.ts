
import { describe, it, expect } from 'vitest';

import { parseArgs } from './args.js';

describe('args', () => {
  it('parses array of same flags', () => {
    const args = parseArgs(['--foo', 'bar', '--foo', 'baz']);
    expect(args.flags.foo).toEqual(['bar', 'baz']);
  });
  it('parses --flag=value', () => {
    const args = parseArgs(['--foo=bar']);
    expect(args.flags.foo).toBe('bar');
  });
  it('parses bool flag at end or followed by another flag', () => {
    const args = parseArgs(['--foo', '--bar']);
    expect(args.flags.foo).toBe(true);
    expect(args.flags.bar).toBe(true);
  });
  it('parses multiple repeated flags', () => {
    const args = parseArgs(['--foo', 'bar', '--foo', 'baz', '--foo', 'qux']);
    expect(args.flags.foo).toEqual(['bar', 'baz', 'qux']);
  });
});
