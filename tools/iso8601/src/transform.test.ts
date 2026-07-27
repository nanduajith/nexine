import { describe, expect, it } from 'vitest';

import { parseIso } from './transform';
describe('iso', () => {
  it('valid', () => {
    const res = parseIso('2024-01-01T00:00:00Z');
    expect(res.utc).toBeDefined();
    expect(res.local).toBeDefined();
    expect(res.timestamp).toBeDefined();
    expect(res.iso).toBeDefined();
  });
  it('invalid', () => expect(() => parseIso('invalid')).toThrow('Invalid ISO string'));
});