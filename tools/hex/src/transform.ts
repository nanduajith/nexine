import { err, ok, type Result } from '@nexine/core';

/** Encode UTF-8 text to a hex string with the given byte delimiter. */
export function textToHex(input: string, delimiter = ' '): string {
  const bytes = new TextEncoder().encode(input);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(delimiter);
}

/** Decode a hex string (tolerant of spaces, commas, colons, and 0x prefixes). */
export function hexToText(input: string): Result<string> {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:_-]+/g, '');
  if (cleaned === '') return ok('');
  if (cleaned.length % 2 !== 0) return err('Hex must have an even number of digits.');
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return err('Input contains non-hex characters.');

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return ok(new TextDecoder('utf-8').decode(bytes));
}
