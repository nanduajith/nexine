import { err, ok, type Result } from '@nexine/core';

/**
 * A pure, dependency-free parser and explainer for standard 5-field cron
 * expressions (`minute hour day-of-month month day-of-week`). It supports `*`,
 * lists (`a,b`), ranges (`a-b`), steps (`a-b/n` and star-slash-n), the `@`-macros, and the
 * usual three-letter month/weekday names — then renders a plain-language summary
 * and computes upcoming run times. Everything is evaluated in UTC so results are
 * deterministic and unit-testable; the UI is responsible for any local-time view.
 */

interface FieldSpec {
  readonly name: string;
  readonly min: number;
  readonly max: number;
  /** Named aliases (lower-cased) → numeric value, e.g. `jan` → 1. */
  readonly names?: Readonly<Record<string, number>>;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTH_NAMES = Object.fromEntries(MONTHS.map((m, i) => [m, i + 1]));
const DAY_NAMES = Object.fromEntries(DAYS.map((d, i) => [d, i]));

const FIELDS: readonly FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day-of-month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTH_NAMES },
  // Max is 7 because 7 is a common alias for Sunday; it is normalized to 0 below.
  { name: 'day-of-week', min: 0, max: 7, names: DAY_NAMES },
];

/** `@`-macros expand to their equivalent 5-field expression. */
const MACROS: Readonly<Record<string, string>> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export interface CronField {
  /** The raw token as written (e.g. a star-slash-5 step). */
  readonly raw: string;
  /** Every value this field matches, ascending. */
  readonly values: readonly number[];
  /** True when the field is an unrestricted star (or star-slash-1). */
  readonly isWildcard: boolean;
}

export interface ParsedCron {
  /** The expression actually parsed (after any macro expansion). */
  readonly normalized: string;
  readonly minute: CronField;
  readonly hour: CronField;
  readonly dayOfMonth: CronField;
  readonly month: CronField;
  readonly dayOfWeek: CronField;
  /** One-line plain-language description. */
  readonly description: string;
}

function parseValue(token: string, spec: FieldSpec): Result<number> {
  const lower = token.toLowerCase();
  if (spec.names && lower in spec.names) return ok(spec.names[lower] as number);
  if (!/^\d+$/.test(token)) return err(`"${token}" is not valid for ${spec.name}`);
  const value = Number(token);
  if (value < spec.min || value > spec.max) {
    return err(`${spec.name} value ${value} is out of range ${spec.min}–${spec.max}`);
  }
  return ok(value);
}

/** Parse a single field token (which may itself be a comma-separated list). */
function parseField(raw: string, spec: FieldSpec): Result<CronField> {
  const matched = new Set<number>();

  for (const part of raw.split(',')) {
    if (part === '') return err(`empty term in ${spec.name}`);

    const slash = part.split('/');
    const rangePart = slash[0] as string;
    const stepPart = slash[1];
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) {
        return err(`invalid step "/${stepPart}" in ${spec.name}`);
      }
      step = Number(stepPart);
    }

    let lo: number;
    let hi: number;
    if (rangePart === '*') {
      lo = spec.min;
      hi = spec.max;
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-');
      if (a === undefined || b === undefined) return err(`invalid range "${rangePart}"`);
      const start = parseValue(a, spec);
      if (!start.ok) return start;
      const end = parseValue(b, spec);
      if (!end.ok) return end;
      if (start.value > end.value) return err(`range start > end in "${rangePart}"`);
      lo = start.value;
      hi = end.value;
    } else {
      const single = parseValue(rangePart, spec);
      if (!single.ok) return single;
      // A bare value with a step (`5/10`) means "from 5 to max, every step".
      lo = single.value;
      hi = stepPart !== undefined ? spec.max : single.value;
    }

    for (let v = lo; v <= hi; v += step) matched.add(v);
  }

  let values = [...matched].sort((a, b) => a - b);
  // Day-of-week 7 is a common alias for Sunday (0); normalize on the way in.
  if (spec.name === 'day-of-week' && values.includes(7)) {
    values = [...new Set(values.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b);
  }
  const isWildcard = raw === '*' || raw === '*/1';
  return ok({ raw, values, isWildcard });
}

/** Parse (and validate) a cron expression, expanding `@`-macros first. */
export function parseCron(input: string): Result<ParsedCron> {
  const trimmed = input.trim();
  if (!trimmed) return err('Enter a cron expression.');

  const expanded = MACROS[trimmed.toLowerCase()] ?? trimmed;
  const tokens = expanded.split(/\s+/);
  if (tokens.length !== 5) {
    return err(
      `Expected 5 fields (minute hour day-of-month month day-of-week), got ${tokens.length}.`,
    );
  }

  const parsed: CronField[] = [];
  for (let i = 0; i < FIELDS.length; i++) {
    const field = parseField(tokens[i] as string, FIELDS[i] as FieldSpec);
    if (!field.ok) return field;
    parsed.push(field.value);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed as [
    CronField,
    CronField,
    CronField,
    CronField,
    CronField,
  ];

  return ok({
    normalized: expanded,
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    description: describe(minute, hour, dayOfMonth, month, dayOfWeek),
  });
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function list<T>(values: readonly T[], render: (value: T) => string): string {
  const rendered = values.map(render);
  if (rendered.length === 1) return rendered[0] as string;
  if (rendered.length === 2) return `${rendered[0]} and ${rendered[1]}`;
  return `${rendered.slice(0, -1).join(', ')}, and ${rendered[rendered.length - 1]}`;
}

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; // prettier-ignore
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Build a one-line plain-language summary of the schedule. */
function describe(
  minute: CronField,
  hour: CronField,
  dayOfMonth: CronField,
  month: CronField,
  dayOfWeek: CronField,
): string {
  let time: string;
  if (minute.isWildcard && hour.isWildcard) {
    time = 'Every minute';
  } else if (hour.isWildcard && minute.values.length === 1) {
    time = `At minute ${minute.values[0]} of every hour`;
  } else if (hour.isWildcard) {
    time = `At minute ${list(minute.values, (m) => String(m))} of every hour`;
  } else if (minute.isWildcard) {
    time = `Every minute during ${list(hour.values, (h) => `${h}:00`)}`;
  } else {
    const times = hour.values.flatMap((h) =>
      minute.values.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
    );
    time = `At ${list(times, (t) => t)}`;
  }

  const parts: string[] = [time];

  if (!dayOfMonth.isWildcard) {
    parts.push(`on the ${list(dayOfMonth.values, ordinal)} of the month`);
  }
  if (!dayOfWeek.isWildcard) {
    parts.push(`on ${list(dayOfWeek.values, (d) => DAY_LABELS[d] as string)}`);
  }
  if (!month.isWildcard) {
    parts.push(`in ${list(month.values, (m) => MONTH_LABELS[m - 1] as string)}`);
  }

  return `${parts.join(', ')} (UTC).`;
}

/**
 * Compute the next `count` UTC run times at or after `from` (exclusive of
 * `from` itself). Standard cron day semantics: when *both* day-of-month and
 * day-of-week are restricted, a day matches if *either* matches; otherwise the
 * restricted one alone applies.
 */
export function nextRuns(parsed: ParsedCron, from: Date, count = 5): Date[] {
  const runs: Date[] = [];
  const domRestricted = !parsed.dayOfMonth.isWildcard;
  const dowRestricted = !parsed.dayOfWeek.isWildcard;

  const minuteSet = new Set(parsed.minute.values);
  const hourSet = new Set(parsed.hour.values);
  const domSet = new Set(parsed.dayOfMonth.values);
  const monthSet = new Set(parsed.month.values);
  const dowSet = new Set(parsed.dayOfWeek.values);

  // Start from the next whole minute after `from`.
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  // Cap the search so a pathological expression can never loop forever.
  const limit = new Date(cursor.getTime());
  limit.setUTCFullYear(limit.getUTCFullYear() + 5);

  while (runs.length < count && cursor <= limit) {
    const dayMatches =
      domRestricted && dowRestricted
        ? domSet.has(cursor.getUTCDate()) || dowSet.has(cursor.getUTCDay())
        : (!domRestricted || domSet.has(cursor.getUTCDate())) &&
          (!dowRestricted || dowSet.has(cursor.getUTCDay()));

    if (
      monthSet.has(cursor.getUTCMonth() + 1) &&
      dayMatches &&
      hourSet.has(cursor.getUTCHours()) &&
      minuteSet.has(cursor.getUTCMinutes())
    ) {
      runs.push(new Date(cursor.getTime()));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }

  return runs;
}
