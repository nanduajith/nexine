/**
 * A pure, dependency-free line diff built on the classic longest-common-
 * subsequence dynamic program. It reports every line as unchanged, added, or
 * removed, with the corresponding line numbers on each side — enough for the UI
 * to render a side-by-side or unified view, plus a small summary.
 */

export type DiffOp = 'equal' | 'add' | 'remove';

export interface DiffLine {
  readonly op: DiffOp;
  /** 1-based line number in the original text, or null for an added line. */
  readonly leftNumber: number | null;
  /** 1-based line number in the new text, or null for a removed line. */
  readonly rightNumber: number | null;
  readonly text: string;
}

export interface DiffSummary {
  readonly added: number;
  readonly removed: number;
  readonly unchanged: number;
}

export interface DiffResult {
  readonly lines: readonly DiffLine[];
  readonly summary: DiffSummary;
  /** True when the two inputs are identical. */
  readonly identical: boolean;
}

export interface DiffOptions {
  /** Ignore leading/trailing whitespace when comparing lines. */
  readonly trimWhitespace?: boolean;
  /** Compare case-insensitively. */
  readonly ignoreCase?: boolean;
}

function splitLines(text: string): string[] {
  // A trailing newline shouldn't manufacture a spurious empty final line.
  const normalized = text.replace(/\r\n?/g, '\n');
  if (normalized === '') return [];
  const lines = normalized.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function normalizeFor(line: string, opts: DiffOptions): string {
  let key = line;
  if (opts.trimWhitespace) key = key.trim();
  if (opts.ignoreCase) key = key.toLowerCase();
  return key;
}

/** Diff two multi-line strings by line. */
export function diffLines(left: string, right: string, opts: DiffOptions = {}): DiffResult {
  const a = splitLines(left);
  const b = splitLines(right);
  const ka = a.map((l) => normalizeFor(l, opts));
  const kb = b.map((l) => normalizeFor(l, opts));

  // LCS length table over the normalized keys.
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] =
        ka[i] === kb[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let i = 0;
  let j = 0;

  const pushRemoved = () => {
    lines.push({ op: 'remove', leftNumber: i + 1, rightNumber: null, text: a[i] as string });
    removed++;
    i++;
  };
  const pushAdded = () => {
    lines.push({ op: 'add', leftNumber: null, rightNumber: j + 1, text: b[j] as string });
    added++;
    j++;
  };

  while (i < n && j < m) {
    if (ka[i] === kb[j]) {
      lines.push({ op: 'equal', leftNumber: i + 1, rightNumber: j + 1, text: a[i] as string });
      unchanged++;
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      pushRemoved();
    } else {
      pushAdded();
    }
  }
  while (i < n) pushRemoved();
  while (j < m) pushAdded();

  return {
    lines,
    summary: { added, removed, unchanged },
    identical: added === 0 && removed === 0,
  };
}
