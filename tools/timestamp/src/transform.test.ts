import { describe, expect, it } from 'vitest';

import { describeTime, parseTimeInput } from './transform';
describe('timestamp', () => {
  it('empty input', () => expect(parseTimeInput('').ok).toBe(true));
  it('Unix seconds', () => expect((parseTimeInput('1516239022') as any).value.getTime()).toBe(1516239022 * 1000));
  it('Unix millis', () => expect((parseTimeInput('1516239022000') as any).value.getTime()).toBe(1516239022000));
  it('ISO 8601', () => expect((parseTimeInput('2020-01-01T00:00:00.000Z') as any).value.toISOString()).toBe('2020-01-01T00:00:00.000Z'));
  it('invalid Unix', () => expect(parseTimeInput('9999999999999999999999').ok).toBe(false));
  it('invalid Date', () => expect(parseTimeInput('nonsense').ok).toBe(false));
  it('describeTime', () => {
    const d = new Date(0);
    const now = new Date(1000);
    const res = describeTime(d, now);
    expect(res.unixSeconds).toBe(0);
    expect(res.unixMillis).toBe(0);
    expect(res.iso).toBe('1970-01-01T00:00:00.000Z');
    expect(res.utc).toBeDefined();
    expect(res.local).toBeDefined();
    expect(res.relative).toBe('1 second ago');
  });
  it('describeTime relative fallback', () => expect(describeTime(new Date(), new Date()).relative).toBe('now'));
});