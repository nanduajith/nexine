import { err, ok, type Result } from '@nexine/core';

/** Encode text for use in a URL. `component` uses encodeURIComponent (default). */
export function encodeUrl(input: string, component = true): string {
  return component ? encodeURIComponent(input) : encodeURI(input);
}

/** Decode a percent-encoded string. Returns a Result — decoding can fail. */
export function decodeUrl(input: string, component = true): Result<string> {
  try {
    return ok(component ? decodeURIComponent(input) : decodeURI(input));
  } catch {
    return err('Malformed percent-encoding.');
  }
}

export interface QueryParam {
  readonly key: string;
  readonly value: string;
}

/** Parse the query portion of a URL (or a bare query string) into key/value pairs. */
export function parseQuery(input: string): readonly QueryParam[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const queryStart = trimmed.indexOf('?');
  const query = queryStart >= 0 ? trimmed.slice(queryStart + 1) : trimmed;
  const params = new URLSearchParams(query);
  return [...params.entries()].map(([key, value]) => ({ key, value }));
}
