/**
 * Identifier generation using the platform CSPRNG (crypto.randomUUID /
 * getRandomValues) — never Math.random for anything identity-bearing.
 */

/** Generate a RFC 4122 version-4 UUID. */
export function uuidV4(): string {
  return crypto.randomUUID();
}

/** Generate `count` UUIDs (clamped to a sane range). */
export function generateUuids(count: number): string[] {
  const n = Math.min(Math.max(Math.trunc(count), 1), 50);
  return Array.from({ length: n }, () => crypto.randomUUID());
}

/** Generate cryptographically-random bytes as a lowercase hex string. */
export function randomHex(byteLength: number): string {
  const n = Math.min(Math.max(Math.trunc(byteLength), 1), 256);
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
