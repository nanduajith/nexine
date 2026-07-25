import { err, ok, type Result } from '@nexine/core';

function parseJson(input: string): Result<unknown> {
  try {
    return ok(JSON.parse(input));
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Invalid JSON.');
  }
}

/** Pretty-print JSON with the given indentation (`'\t'` for tabs). */
export function formatJson(input: string, indent: number | '\t' = 2): Result<string> {
  if (input.trim() === '') return ok('');
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value, null, indent));
}

/** Collapse JSON to a single line. */
export function minifyJson(input: string): Result<string> {
  if (input.trim() === '') return ok('');
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return ok(JSON.stringify(parsed.value));
}
