import { err, ok, type Result } from '@nexine/core';

/**
 * Convert between `.env` files and JSON, in both directions, with no
 * dependencies. Parsing follows the widely-used dotenv conventions: `KEY=VALUE`
 * lines, `#` comments, blank lines, an optional `export ` prefix, and single- or
 * double-quoted values (double quotes honor `\n`/`\t`/`\\` escapes). JSON output
 * is a flat object of string values; conversion the other way stringifies scalar
 * values and quotes anything that needs it.
 */

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Parse a `.env` document into ordered key/value pairs. */
export function parseEnv(input: string): Result<Record<string, string>> {
  const result: Record<string, string> = {};
  const lines = input.replace(/\r\n?/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i] as string;
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (line.startsWith('export ')) line = line.slice('export '.length);

    const eq = line.indexOf('=');
    if (eq === -1) return err(`Line ${i + 1}: expected KEY=VALUE.`);

    const key = line.slice(0, eq).trim();
    if (!KEY_RE.test(key)) return err(`Line ${i + 1}: "${key}" is not a valid variable name.`);

    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1);
    } else {
      // Unquoted: strip a trailing inline comment (` # …`).
      const hash = value.indexOf(' #');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    result[key] = value;
  }
  return ok(result);
}

/** Convert a `.env` document to pretty-printed JSON. */
export function envToJson(input: string): Result<string> {
  const parsed = parseEnv(input);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value, null, 2));
}

const NEEDS_QUOTES = /[\s#"'=]|^$/;

function serializeValue(value: string): string {
  if (!NEEDS_QUOTES.test(value) && !value.includes('\n')) return value;
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r');
  return `"${escaped}"`;
}

/** Convert a flat JSON object to a `.env` document. */
export function jsonToEnv(input: string): Result<string> {
  const trimmed = input.trim();
  if (!trimmed) return err('Enter JSON.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return err('Invalid JSON.');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return err('Expected a JSON object of key/value pairs.');
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (!KEY_RE.test(key)) return err(`"${key}" is not a valid environment variable name.`);
    if (value === null || typeof value === 'object') {
      return err(`"${key}" must be a string, number, or boolean.`);
    }
    lines.push(`${key}=${serializeValue(String(value))}`);
  }
  return ok(lines.join('\n'));
}
