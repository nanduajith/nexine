/**
 * The cryptographic primitives, isolated behind a tiny surface so the rest of the
 * packaging layer never touches `crypto.subtle` directly. Ed25519 is used for
 * signatures — small keys/signatures, no parameter choices to get wrong — via
 * WebCrypto, which is native in both Node (build tool) and the browser (host).
 *
 * Keys are exchanged as SPKI (public) / PKCS8 (private) DER, base64-encoded, so a
 * keypair is a pair of portable strings the `nexine` CLI can write to disk and the
 * host can pin in a trust store.
 */

import { base64ToBytes, bytesToBase64, bytesToBase64Url } from './encoding';

const ALGORITHM = 'Ed25519';

// `crypto` is a global in Node 20+ and all target browsers; assert its presence
// once with a clear error rather than failing cryptically deep in a call.
function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) {
    throw new Error('WebCrypto (crypto.subtle) is unavailable in this runtime');
  }
  return c.subtle;
}

export interface KeyPairMaterial {
  /** Base64 SPKI DER public key. Safe to publish and pin. */
  readonly publicKey: string;
  /** Base64 PKCS8 DER private key. Secret — never leaves the signer. */
  readonly privateKey: string;
  /** Fingerprint of the public key. */
  readonly keyId: string;
}

/** Generate a fresh Ed25519 signing keypair as portable base64 strings. */
export async function generateKeyPair(): Promise<KeyPairMaterial> {
  const pair = await subtle().generateKey({ name: ALGORITHM }, true, ['sign', 'verify']);
  const spki = new Uint8Array(await subtle().exportKey('spki', pair.publicKey));
  const pkcs8 = new Uint8Array(await subtle().exportKey('pkcs8', pair.privateKey));
  const publicKey = bytesToBase64(spki);
  return {
    publicKey,
    privateKey: bytesToBase64(pkcs8),
    keyId: await keyIdFromPublicKey(publicKey),
  };
}

/**
 * A short, stable identifier for a public key: base64url of the SHA-256 of its
 * SPKI bytes, truncated to 16 bytes. Only ever a convenience label — trust is
 * always decided against the full public key, never the id alone.
 */
export async function keyIdFromPublicKey(publicKeyBase64: string): Promise<string> {
  const digest = new Uint8Array(await subtle().digest('SHA-256', base64ToBytes(publicKeyBase64)));
  return bytesToBase64Url(digest.subarray(0, 16));
}

/** Sign a message with a base64 PKCS8 private key, returning a base64 signature. */
export async function sign(
  message: Uint8Array<ArrayBuffer>,
  privateKeyBase64: string,
): Promise<string> {
  const key = await subtle().importKey(
    'pkcs8',
    base64ToBytes(privateKeyBase64),
    { name: ALGORITHM },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await subtle().sign({ name: ALGORITHM }, key, message));
  return bytesToBase64(signature);
}

/**
 * Verify a base64 signature over a message against a base64 SPKI public key.
 * Returns `false` (never throws) for malformed keys/signatures so a hostile
 * package cannot turn a verification attempt into an exception path.
 */
export async function verify(
  message: Uint8Array<ArrayBuffer>,
  signatureBase64: string,
  publicKeyBase64: string,
): Promise<boolean> {
  try {
    const key = await subtle().importKey(
      'spki',
      base64ToBytes(publicKeyBase64),
      { name: ALGORITHM },
      false,
      ['verify'],
    );
    return await subtle().verify({ name: ALGORITHM }, key, base64ToBytes(signatureBase64), message);
  } catch {
    return false;
  }
}
