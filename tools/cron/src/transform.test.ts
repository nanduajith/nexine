import { describe, expect, it } from 'vitest';

import { nextRuns, parseCron } from './transform';
const parse = (expr: string) => {
  const r = parseCron(expr);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
describe('cron parse', () => {
  it('parses daily', () => expect(parse('30 9 * * *').description).toBe('At 09:30 (UTC).'));
  it('expands steps, ranges, lists', () => expect(parse('*/15 9-17 1,15 * *').minute.values).toEqual([0, 15, 30, 45]));
  it('understands names', () => expect(parse('0 0 * jan-mar mon-fri').month.values).toEqual([1, 2, 3]));
  it('expands macros', () => expect(parse('@daily').normalized).toBe('0 0 * * *'));
  it('summarizes every-N-minutes', () => expect(parse('*/15 * * * *').description).toBe('At minute 0, 15, 30, and 45 of every hour (UTC).'));
  it('describes wildcards', () => expect(parse('* * * * *').description).toBe('Every minute (UTC).'));
  it('rejects malformed', () => expect(parseCron('').ok).toBe(false));
  it('rejects length != 5', () => expect(parseCron('* * * *').ok).toBe(false));
  it('rejects out of range', () => expect(parseCron('60 * * * *').ok).toBe(false));
  it('rejects zero step', () => expect(parseCron('*/0 * * * *').ok).toBe(false));
  it('rejects reversed range', () => expect(parseCron('5-1 * * * *').ok).toBe(false));
  it('rejects garbage', () => expect(parseCron('a * * * *').ok).toBe(false));
  it('rejects invalid step val', () => expect(parseCron('*/a * * * *').ok).toBe(false));
  it('rejects invalid range val', () => expect(parseCron('1-a * * * *').ok).toBe(false));
  it('empty term', () => expect(parseCron(', * * * *').ok).toBe(false));
});
describe('cron nextRuns', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  it('daily runs', () => expect(nextRuns(parse('0 0 * * *'), from, 1)[0]?.toISOString()).toBe('2026-01-02T00:00:00.000Z'));
  it('step within hour', () => expect(nextRuns(parse('*/15 * * * *'), from, 1)[0]?.toISOString()).toBe('2026-01-01T00:15:00.000Z'));
  it('ORs dom and dow', () => expect(nextRuns(parse('0 0 15 * mon'), from, 1)[0]?.toISOString()).toBe('2026-01-05T00:00:00.000Z'));
});