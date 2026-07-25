/**
 * Cryptographic hashing via the WebCrypto SubtleCrypto API — vetted platform
 * primitives, never a hand-rolled implementation. All computation is local; no
 * data leaves the device.
 */

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

/** Algorithms considered legacy/weak — surfaced in the UI with a warning. */
export const WEAK_ALGORITHMS: ReadonlySet<HashAlgorithm> = new Set(['SHA-1']);

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Hash UTF-8 text and return a lowercase hex digest. */
export async function hashText(input: string, algorithm: HashAlgorithm): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return toHex(digest);
}

/** Compute every supported digest for the input, in parallel. */
export async function hashAll(input: string): Promise<Record<HashAlgorithm, string>> {
  const entries = await Promise.all(
    HASH_ALGORITHMS.map(
      async (algorithm) => [algorithm, await hashText(input, algorithm)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<HashAlgorithm, string>;
}
