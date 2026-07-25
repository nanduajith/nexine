/**
 * Cron Explainer — an example Nexine plugin that does real work.
 *
 * It parses a standard 5-field cron expression, describes each field in plain
 * English, and computes the actual next run times by walking the schedule minute
 * by minute (including the Vixie-cron day-of-month / day-of-week OR rule). It runs
 * entirely inside the sandbox with zero network access; it uses the host bridge
 * only for `storage` (recent expressions) and `clipboard` (copy results).
 *
 * Types come from `@nexine/sdk/guest` for authoring DX; `import type` is erased at
 * bundle time, so the shipped package stays self-contained. At runtime the plugin
 * registers itself through the injected `nexine.definePlugin` global.
 */

import type { ClipboardApi, PluginContext, PluginDefinition, StorageApi } from '@nexine/sdk/guest';

declare const nexine: { definePlugin(def: PluginDefinition): void };

// ---------------------------------------------------------------------------
// Cron parsing
// ---------------------------------------------------------------------------

interface Field {
  /** The set of matching values for this field. */
  readonly values: ReadonlySet<number>;
  /** True when the field was `*` (needed for the DOM/DOW OR rule). */
  readonly wildcard: boolean;
}

interface Schedule {
  readonly minute: Field;
  readonly hour: Field;
  readonly dom: Field;
  readonly month: Field;
  readonly dow: Field;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DOWS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseValue(token: string, min: number, max: number, names?: readonly string[]): number {
  if (names) {
    const asName = names.indexOf(token.toUpperCase());
    if (asName !== -1) return asName + min;
  }
  if (!/^\d+$/.test(token)) throw new Error(`"${token}" is not a valid number`);
  const n = Number(token);
  if (n < min || n > max) throw new Error(`${n} is out of range ${min}-${max}`);
  return n;
}

/** Parse a single cron field: wildcard, step, range, list or names (e.g. `1-5`, `0,30`, `MON-FRI`). */
function parseField(spec: string, min: number, max: number, names?: readonly string[]): Field {
  const values = new Set<number>();
  let wildcard = false;

  for (const part of spec.split(',')) {
    if (part.length === 0) throw new Error('empty term');

    let step = 1;
    let range = part;
    const slash = part.indexOf('/');
    if (slash !== -1) {
      const stepText = part.slice(slash + 1);
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1)
        throw new Error(`invalid step "${part}"`);
      step = Number(stepText);
      range = part.slice(0, slash);
    }

    let lo: number;
    let hi: number;
    if (range === '*') {
      lo = min;
      hi = max;
      if (slash === -1) wildcard = true;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = parseValue(a ?? '', min, max, names);
      hi = parseValue(b ?? '', min, max, names);
    } else {
      lo = parseValue(range, min, max, names);
      // A bare `a/n` means "from a to the max, every n".
      hi = slash === -1 ? lo : max;
    }
    if (lo > hi) throw new Error(`range ${lo}-${hi} is inverted`);

    for (let v = lo; v <= hi; v += step) values.add(v);
  }

  return { values, wildcard };
}

/** Parse a whole 5-field cron expression. Throws on any malformed field. */
function parseCron(input: string): Schedule {
  const fields = input.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`expected 5 fields (min hour day month weekday), got ${fields.length}`);
  }
  const [min, hour, dom, month, dowRaw] = fields as [string, string, string, string, string];

  const dowField = parseField(dowRaw, 0, 7, DOWS);
  // Normalise Sunday-as-7 down to 0 so downstream comparisons are simple.
  const dowValues = new Set<number>();
  for (const v of dowField.values) dowValues.add(v === 7 ? 0 : v);

  return {
    minute: parseField(min, 0, 59),
    hour: parseField(hour, 0, 23),
    dom: parseField(dom, 1, 31),
    month: parseField(month, 1, 12, MONTHS),
    dow: { values: dowValues, wildcard: dowField.wildcard },
  };
}

// ---------------------------------------------------------------------------
// Plain-English description
// ---------------------------------------------------------------------------

const sorted = (set: ReadonlySet<number>): number[] => [...set].sort((a, b) => a - b);

/** Detect an evenly-spaced "every N" pattern anchored at the range minimum. */
function detectStep(vals: number[], min: number, max: number): number | null {
  if (vals.length < 3 || vals[0] !== min) return null;
  const step = (vals[1] ?? 0) - (vals[0] ?? 0);
  if (step < 2) return null;
  for (let i = 1; i < vals.length; i += 1) {
    if ((vals[i] ?? 0) - (vals[i - 1] ?? 0) !== step) return null;
  }
  if ((vals[vals.length - 1] ?? 0) + step <= max) return null; // must reach the top
  return step;
}

function isContiguous(vals: number[]): boolean {
  for (let i = 1; i < vals.length; i += 1) {
    if ((vals[i] ?? 0) !== (vals[i - 1] ?? 0) + 1) return false;
  }
  return true;
}

function describeField(
  field: Field,
  min: number,
  max: number,
  unit: string,
  label: (n: number) => string,
): string {
  if (field.wildcard) return `every ${unit}`;
  const vals = sorted(field.values);
  if (vals.length === 1) return `at ${unit} ${label(vals[0] ?? 0)}`;

  const step = detectStep(vals, min, max);
  if (step !== null) return `every ${step} ${unit}s`;

  if (isContiguous(vals)) {
    return `${label(vals[0] ?? 0)} through ${label(vals[vals.length - 1] ?? 0)}`;
  }
  return `at ${unit}s ${vals.map(label).join(', ')}`;
}

function describe(schedule: Schedule): string[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    `Minute — ${describeField(schedule.minute, 0, 59, 'minute', pad)}`,
    `Hour — ${describeField(schedule.hour, 0, 23, 'hour', pad)}`,
    `Day of month — ${
      schedule.dom.wildcard ? 'every day' : describeField(schedule.dom, 1, 31, 'day', String)
    }`,
    `Month — ${
      schedule.month.wildcard
        ? 'every month'
        : describeField(schedule.month, 1, 12, 'month', (n) => MONTH_LONG[n - 1] ?? String(n))
    }`,
    `Day of week — ${
      schedule.dow.wildcard
        ? 'every day of the week'
        : describeField(schedule.dow, 0, 6, 'weekday', (n) => DOW_LONG[n] ?? String(n))
    }`,
  ];
}

// ---------------------------------------------------------------------------
// Next run times
// ---------------------------------------------------------------------------

function matches(date: Date, s: Schedule): boolean {
  if (!s.minute.values.has(date.getMinutes())) return false;
  if (!s.hour.values.has(date.getHours())) return false;
  if (!s.month.values.has(date.getMonth() + 1)) return false;

  const domOk = s.dom.values.has(date.getDate());
  const dowOk = s.dow.values.has(date.getDay());
  // Vixie cron: when both day fields are restricted, either may match.
  if (!s.dom.wildcard && !s.dow.wildcard) return domOk || dowOk;
  if (!s.dom.wildcard) return domOk;
  if (!s.dow.wildcard) return dowOk;
  return true;
}

function nextRuns(schedule: Schedule, from: Date, count: number): Date[] {
  const runs: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1); // strictly in the future

  // Cap the search at ~4 years of minutes so an impossible schedule terminates.
  const maxSteps = 4 * 366 * 24 * 60;
  for (let i = 0; i < maxSteps && runs.length < count; i += 1) {
    if (matches(cursor, schedule)) runs.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const C = {
  bg: '#0d1017',
  surface: '#161b26',
  surface2: '#1b2130',
  border: '#232a37',
  fg: '#e5e7eb',
  muted: '#9ca3af',
  subtle: '#6b7280',
  accent: '#818cf8',
  ok: '#4ade80',
  bad: '#f87171',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (style) node.style.cssText = style;
  if (text !== undefined) node.textContent = text;
  return node;
}

const PRESETS: ReadonlyArray<{ expr: string; note: string }> = [
  { expr: '*/5 * * * *', note: 'every 5 min' },
  { expr: '0 9 * * 1-5', note: 'weekday mornings' },
  { expr: '30 2 1 * *', note: 'monthly' },
  { expr: '0 0 * * 0', note: 'weekly (Sun)' },
  { expr: '15 14 1 JAN *', note: 'named month' },
];

const RECENT_KEY = 'recent';
const MAX_RECENT = 8;

nexine.definePlugin({
  setup(ctx: PluginContext) {
    const storage: StorageApi = ctx.host.storage;
    const clipboard: ClipboardApi = ctx.host.clipboard;

    return {
      async mount(root: HTMLElement) {
        root.style.cssText = `font-family:ui-sans-serif,system-ui,sans-serif;background:${C.bg};color:${C.fg};min-height:100vh;box-sizing:border-box;padding:22px 24px`;

        const title = el('div', `font-size:16px;font-weight:600;color:#fff`, 'Cron Explainer');
        const sub = el(
          'div',
          `font-size:12.5px;color:${C.muted};margin:3px 0 16px`,
          'Understand any crontab line and preview when it will actually run — all on-device.',
        );
        root.append(title, sub);

        // --- input row ---
        const input = el(
          'input',
          `flex:1;min-width:0;background:${C.surface};border:1px solid ${C.border};border-radius:9px;color:${C.fg};font:14px ${C.mono};padding:10px 12px;outline:none`,
        ) as HTMLInputElement;
        input.value = '0 9 * * 1-5';
        input.spellcheck = false;
        input.setAttribute('aria-label', 'Cron expression');
        input.addEventListener('focus', () => (input.style.borderColor = C.accent));
        input.addEventListener('blur', () => (input.style.borderColor = C.border));

        const explainBtn = el(
          'button',
          `background:${C.accent};color:#0b1020;border:none;border-radius:9px;font:600 14px system-ui;padding:0 16px;cursor:pointer`,
          'Explain',
        );

        const inputRow = el('div', 'display:flex;gap:10px;align-items:stretch;margin-bottom:10px');
        inputRow.append(input, explainBtn);
        root.append(inputRow);

        // --- presets ---
        const presetRow = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px');
        for (const p of PRESETS) {
          const chip = el(
            'button',
            `background:${C.surface2};border:1px solid ${C.border};border-radius:999px;color:${C.muted};font:12px ${C.mono};padding:4px 10px;cursor:pointer`,
            p.expr,
          );
          chip.title = p.note;
          chip.addEventListener('click', () => {
            input.value = p.expr;
            run();
          });
          presetRow.append(chip);
        }
        root.append(presetRow);

        // --- recent (from storage) ---
        const recentRow = el(
          'div',
          'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:14px;min-height:22px',
        );
        root.append(recentRow);

        // --- results ---
        const results = el('div', '');
        root.append(results);

        // --- helpers ---
        const toast = (msg: string, ok: boolean) => {
          const t = el(
            'div',
            `position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:${C.surface2};border:1px solid ${ok ? C.ok : C.bad};color:${ok ? C.ok : C.bad};font:12.5px system-ui;padding:8px 14px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.4)`,
            msg,
          );
          document.body.appendChild(t);
          setTimeout(() => t.remove(), 1600);
        };

        const copyButton = (label: string, getText: () => string) => {
          const b = el(
            'button',
            `background:${C.surface2};border:1px solid ${C.border};border-radius:7px;color:${C.muted};font:12px system-ui;padding:5px 10px;cursor:pointer`,
            label,
          );
          b.addEventListener('click', async () => {
            try {
              await clipboard.writeText(getText());
              toast('Copied to clipboard', true);
            } catch {
              toast('Clipboard permission denied', false);
            }
          });
          return b;
        };

        const loadRecent = async (): Promise<string[]> => {
          try {
            const raw = await storage.get(RECENT_KEY);
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed)
              ? parsed.filter((x): x is string => typeof x === 'string')
              : [];
          } catch {
            return [];
          }
        };

        const renderRecent = async () => {
          const recent = await loadRecent();
          recentRow.replaceChildren();
          if (recent.length === 0) return;
          recentRow.append(
            el(
              'span',
              `font-size:11px;color:${C.subtle};text-transform:uppercase;letter-spacing:.05em`,
              'recent',
            ),
          );
          for (const expr of recent) {
            const chip = el(
              'button',
              `background:transparent;border:1px dashed ${C.border};border-radius:999px;color:${C.muted};font:12px ${C.mono};padding:3px 9px;cursor:pointer`,
              expr,
            );
            chip.addEventListener('click', () => {
              input.value = expr;
              run();
            });
            recentRow.append(chip);
          }
        };

        const saveRecent = async (expr: string) => {
          const recent = await loadRecent();
          const next = [expr, ...recent.filter((e) => e !== expr)].slice(0, MAX_RECENT);
          try {
            await storage.set(RECENT_KEY, JSON.stringify(next));
          } catch {
            /* storage unavailable — non-fatal */
          }
          await renderRecent();
        };

        const card = (heading: string, actions?: HTMLElement[]) => {
          const wrap = el(
            'div',
            `background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:14px 16px;margin-top:12px`,
          );
          const head = el(
            'div',
            'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px',
          );
          head.append(
            el(
              'div',
              `font:600 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:${C.subtle}`,
              heading,
            ),
          );
          if (actions && actions.length) {
            const a = el('div', 'display:flex;gap:6px');
            a.append(...actions);
            head.append(a);
          }
          wrap.append(head);
          return wrap;
        };

        // --- main action ---
        const run = () => {
          const expr = input.value.trim();
          results.replaceChildren();
          if (!expr) return;

          let schedule: Schedule;
          try {
            schedule = parseCron(expr);
          } catch (e) {
            const err = el(
              'div',
              `background:${C.surface};border:1px solid ${C.bad};color:${C.bad};border-radius:12px;padding:14px 16px;margin-top:12px;font-size:13.5px`,
            );
            err.append(
              el('div', 'font-weight:600;margin-bottom:4px', 'Invalid cron expression'),
              el('div', `color:${C.muted};font:12.5px ${C.mono}`, (e as Error).message),
            );
            results.append(err);
            return;
          }

          void saveRecent(expr);

          // Breakdown card
          const lines = describe(schedule);
          const explainCard = card('Breakdown', [copyButton('Copy', () => lines.join('\n'))]);
          const list = el('div', 'display:flex;flex-direction:column;gap:5px');
          for (const line of lines) {
            const [head, ...rest] = line.split(' — ');
            const rowEl = el('div', 'font-size:13.5px;line-height:1.4');
            rowEl.append(
              el('span', `color:${C.subtle}`, `${head}: `),
              el('span', `color:${C.fg}`, rest.join(' — ')),
            );
            list.append(rowEl);
          }
          explainCard.append(list);
          results.append(explainCard);

          // Next runs card
          const runs = nextRuns(schedule, new Date(), 5);
          const fmt = (d: Date) =>
            d.toLocaleString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
          const runsText = () => runs.map(fmt).join('\n');
          const runsCard = card(
            'Next 5 runs (local time)',
            runs.length ? [copyButton('Copy', runsText)] : undefined,
          );
          if (runs.length === 0) {
            runsCard.append(
              el(
                'div',
                `color:${C.muted};font-size:13px`,
                'No run times in the next ~4 years — this schedule can never fire (e.g. Feb 30).',
              ),
            );
          } else {
            const rl = el('div', 'display:flex;flex-direction:column;gap:6px');
            runs.forEach((d, i) => {
              const item = el(
                'div',
                `display:flex;align-items:baseline;gap:10px;font:13px ${C.mono}`,
              );
              item.append(
                el('span', `color:${C.accent};width:16px`, `${i + 1}`),
                el('span', `color:${C.fg}`, fmt(d)),
              );
              rl.append(item);
            });
            runsCard.append(rl);
          }
          results.append(runsCard);
        };

        explainBtn.addEventListener('click', run);
        input.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter') run();
        });

        await renderRecent();
        run();
      },
    };
  },
});
