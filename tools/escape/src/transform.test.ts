import { describe, expect, it } from 'vitest';

import { escapeStr, unescapeStr } from './transform';

describe('escape', () => {
  describe('escapeStr', () => {
    it('returns empty string on empty input', () => {
      expect(escapeStr('')).toBe('');
    });
    it('escapes characters correctly', () => {
      expect(escapeStr('\n')).toBe('\\n');
      expect(escapeStr('hello "world"')).toBe('hello \\"world\\"');
    });
  });

  describe('unescapeStr', () => {
    it('returns empty string on empty input', () => {
      expect(unescapeStr('')).toBe('');
    });
    it('unescapes characters correctly', () => {
      expect(unescapeStr('hello \\"world\\"')).toBe('hello "world"');
    });
    it('returns input on parse error', () => {
      expect(unescapeStr('invalid \\" string')).toBe('invalid " string');
    });
  });
});