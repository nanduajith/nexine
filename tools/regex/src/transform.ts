import { err, ok, type Result } from '@nexine/core';

export interface RegexMatch {
  readonly match: string;
  readonly index: number;
  readonly groups: readonly (string | undefined)[];
}

const MAX_MATCHES = 1000;

/**
 * Run a regular expression against text and collect matches. Always evaluated
 * with the global flag so `matchAll` returns every occurrence. Returns a Result
 * so an invalid pattern renders as an error rather than throwing.
 */
export function runRegex(pattern: string, flags: string, text: string): Result<RegexMatch[]> {
  if (pattern === '') return ok([]);

  const effectiveFlags = flags.includes('g') ? flags : `${flags}g`;
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, effectiveFlags);
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Invalid regular expression.');
  }

  const matches: RegexMatch[] = [];
  for (const match of text.matchAll(regex)) {
    matches.push({ match: match[0] ?? '', index: match.index ?? 0, groups: match.slice(1) });
    if (matches.length >= MAX_MATCHES) break;
  }
  return ok(matches);
}
