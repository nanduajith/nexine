import { err, ok, type Result } from '@nexine/core';

export interface TimeBreakdown {
  readonly unixSeconds: number;
  readonly unixMillis: number;
  readonly iso: string;
  readonly utc: string;
  readonly local: string;
  readonly relative: string;
}

/**
 * Parse flexible time input: empty → now; all-digits → Unix time (auto seconds
 * vs milliseconds by magnitude); otherwise a Date-parseable string (ISO 8601).
 */
export function parseTimeInput(input: string): Result<Date> {
  const trimmed = input.trim();
  if (!trimmed) return ok(new Date());

  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const millis = Math.abs(num) >= 1e12 ? num : num * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? err('Timestamp is out of range.') : ok(date);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? err('Could not parse. Try a Unix timestamp or an ISO 8601 date.')
    : ok(parsed);
}

const RELATIVE_UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

function relativeTime(date: Date, now: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return 'now';
}

export function describeTime(date: Date, now: Date = new Date()): TimeBreakdown {
  return {
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMillis: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative: relativeTime(date, now),
  };
}
