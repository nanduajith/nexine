/**
 * A minimal argv parser — just enough for this CLI, with no dependency. Supports
 * `--flag value`, `--flag=value`, boolean `--flag`, repeated flags (collected as
 * arrays), and positional arguments.
 */

export interface ParsedArgs {
  readonly positionals: readonly string[];
  /** A flag seen once is a string (or `true` if valueless); repeated flags become arrays. */
  readonly flags: Readonly<Record<string, string | boolean | string[]>>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean | string[]> = {};

  const add = (key: string, value: string | boolean): void => {
    const existing = flags[key];
    if (existing === undefined) {
      flags[key] = value;
    } else if (Array.isArray(existing)) {
      if (typeof value === 'string') existing.push(value);
    } else if (typeof existing === 'string' && typeof value === 'string') {
      flags[key] = [existing, value];
    }
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === undefined) continue;
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq !== -1) {
        add(body.slice(0, eq), body.slice(eq + 1));
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          add(body, next);
          i += 1;
        } else {
          add(body, true);
        }
      }
    } else {
      positionals.push(token);
    }
  }

  return { positionals, flags };
}

/** Read a flag expected to be a single string value, if present. */
export function stringFlag(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === 'string' ? value : undefined;
}

/** Read a flag as a list of strings (single or repeated), always an array. */
export function stringList(args: ParsedArgs, name: string): readonly string[] {
  const value = args.flags[name];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value;
  return [];
}
