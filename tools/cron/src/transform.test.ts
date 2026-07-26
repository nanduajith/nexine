import { describe, expect, it } from 'vitest';

import { nextRuns, parseCron } from './transform';

const parse = (expr: string) => {
  const r = parseCron(expr);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('cron parse', () => {
  it('parses a simple daily schedule', () => {
    const p = parse('30 9 * * *');
    expect(p.minute.values).toEqual([30]);
    expect(p.hour.values).toEqual([9]);
    expect(p.dayOfMonth.isWildcard).toBe(true);
    expect(p.description).toBe('At 09:30 (UTC).');
  });

  it('expands steps, ranges, and lists', () => {
    expect(parse('*/15 * * * *').minute.values).toEqual([0, 15, 30, 45]);
    expect(parse('0 9-17 * * *').hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(parse('0 0 1,15 * *').dayOfMonth.values).toEqual([1, 15]);
    expect(parse('0 0-23/6 * * *').hour.values).toEqual([0, 6, 12, 18]);
  });

  it('understands month and weekday names, and 7 == Sunday', () => {
    expect(parse('0 0 * jan-mar *').month.values).toEqual([1, 2, 3]);
    expect(parse('0 0 * * mon-fri').dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
    expect(parse('0 0 * * 7').dayOfWeek.values).toEqual([0]);
  });

  it('expands @-macros', () => {
    const p = parse('@daily');
    expect(p.normalized).toBe('0 0 * * *');
    expect(p.description).toBe('At 00:00 (UTC).');
    expect(parse('@hourly').description).toBe('At minute 0 of every hour (UTC).');
  });

  it('summarizes an every-N-minutes schedule concisely', () => {
    expect(parse('*/15 * * * *').description).toBe(
      'At minute 0, 15, 30, and 45 of every hour (UTC).',
    );
  });

  it('describes wildcards and named days', () => {
    expect(parse('* * * * *').description).toBe('Every minute (UTC).');
    expect(parse('0 12 * * 1').description).toBe('At 12:00, on Monday (UTC).');
    expect(parse('0 0 1 * *').description).toBe('At 00:00, on the 1st of the month (UTC).');
  });

  it('rejects malformed expressions', () => {
    expect(parseCron('').ok).toBe(false);
    expect(parseCron('* * * *').ok).toBe(false); // 4 fields
    expect(parseCron('60 * * * *').ok).toBe(false); // minute out of range
    expect(parseCron('0 0 * * 8').ok).toBe(false); // weekday out of range
    expect(parseCron('*/0 * * * *').ok).toBe(false); // zero step
    expect(parseCron('5-1 * * * *').ok).toBe(false); // reversed range
    expect(parseCron('a * * * *').ok).toBe(false); // garbage
  });
});

describe('cron nextRuns', () => {
  const from = new Date('2026-01-01T00:00:00Z');

  it('computes upcoming daily runs (exclusive of `from`)', () => {
    const runs = nextRuns(parse('0 0 * * *'), from, 3).map((d) => d.toISOString());
    expect(runs).toEqual([
      '2026-01-02T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
      '2026-01-04T00:00:00.000Z',
    ]);
  });

  it('handles step schedules within the hour', () => {
    const runs = nextRuns(parse('*/15 * * * *'), from, 2).map((d) => d.toISOString());
    expect(runs).toEqual(['2026-01-01T00:15:00.000Z', '2026-01-01T00:30:00.000Z']);
  });

  it('ORs day-of-month and day-of-week when both are restricted', () => {
    // 15th OR any Monday. 2026-01-01 is a Thursday.
    const runs = nextRuns(parse('0 0 15 * mon'), from, 3).map((d) => d.toISOString());
    expect(runs).toEqual([
      '2026-01-05T00:00:00.000Z', // Monday
      '2026-01-12T00:00:00.000Z', // Monday
      '2026-01-15T00:00:00.000Z', // the 15th
    ]);
  });

  it('rolls across month and year boundaries', () => {
    const runs = nextRuns(parse('0 0 1 1 *'), from, 2).map((d) => d.toISOString());
    expect(runs).toEqual(['2027-01-01T00:00:00.000Z', '2028-01-01T00:00:00.000Z']);
  });
});
