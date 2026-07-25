import { err, ok, type Result } from '@nexine/core';

/**
 * Encode UTF-8 text to Base64. `btoa` only handles Latin-1, so we encode to bytes
 * first to correctly support the full Unicode range.
 */
export function encodeBase64(input: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64;
}

/**
 * Decode Base64 (standard or URL-safe, padded or not) back to UTF-8 text.
 * Returns a Result rather than throwing so the UI can render errors as data.
 */
export function decodeBase64(input: string): Result<string> {
  const cleaned = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  if (cleaned === '') return ok('');

  const paddingNeeded = (4 - (cleaned.length % 4)) % 4;
  const padded = cleaned + '='.repeat(paddingNeeded);

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return ok(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return err('Not valid Base64.');
  }
}
