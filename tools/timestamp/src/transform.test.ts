import { describe, expect, it } from 'vitest';

import { describeTime, parseTimeInput } from './transform';

describe('timestamp', () => {
  it('parses Unix seconds', () => {
    const result = parseTimeInput('1516239022');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.getTime()).toBe(1516239022 * 1000);
  });

  it('parses Unix milliseconds by magnitude', () => {
    const result = parseTimeInput('1516239022000');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.getTime()).toBe(1516239022000);
  });

  it('parses ISO 8601', () => {
    const result = parseTimeInput('2020-01-01T00:00:00.000Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toISOString()).toBe('2020-01-01T00:00:00.000Z');
  });

  it('rejects nonsense', () => {
    expect(parseTimeInput('definitely not a date').ok).toBe(false);
  });

  it('describes the epoch', () => {
    const breakdown = describeTime(new Date(0));
    expect(breakdown.unixSeconds).toBe(0);
    expect(breakdown.iso).toBe('1970-01-01T00:00:00.000Z');
  });
});
