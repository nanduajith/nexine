/**
 * Small, dependency-free byte/string codecs that behave identically in Node and
 * the browser. The packaging layer must be isomorphic — the same signature bytes
 * are produced by the `nexine` build tool (Node) and verified by the host at
 * side-load time (browser) — so we deliberately avoid `Buffer` and rely only on
 * `TextEncoder`/`btoa`/`atob`, which are global in both runtimes.
 */

const encoder = /* @__PURE__ */ new TextEncoder();
const decoder = /* @__PURE__ */ new TextDecoder('utf-8', { fatal: true });

export function utf8ToBytes(text: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(text) as Uint8Array<ArrayBuffer>;
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

/** Standard base64 (with padding). Binary-safe across runtimes via `btoa`. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  // Chunk to keep the intermediate binary string small for large payloads.
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** URL-safe base64 without padding — used for compact, filesystem-safe key ids. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
