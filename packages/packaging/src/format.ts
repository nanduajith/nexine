/**
 * The on-disk / on-wire shape of a signed plugin package (`.nexpkg`, a JSON
 * document). It bundles the manifest, the built plugin module source, and a
 * detached Ed25519 signature over a canonical envelope of both. The host verifies
 * the signature *before* the manifest is ever trusted or any code runs.
 *
 * The manifest is carried as `unknown`: a package is untrusted input until both
 * its signature is verified here and its manifest passes `validateManifest`.
 */

/** Bumped only on breaking changes to the package/signature layout. */
export const PACKAGE_FORMAT_VERSION = 1 as const;

/** The only signature algorithm the format supports today. */
export const SIGNATURE_ALGORITHM = 'ed25519' as const;

export interface PackageSignature {
  readonly algorithm: typeof SIGNATURE_ALGORITHM;
  /** Signer's public key, base64-encoded SPKI DER. */
  readonly publicKey: string;
  /** Stable fingerprint of `publicKey` (see `keyIdFromPublicKey`). */
  readonly keyId: string;
  /** When the package was signed, epoch milliseconds. Covered by the signature. */
  readonly signedAt: number;
  /** Base64 Ed25519 signature over the canonical signing envelope. */
  readonly value: string;
}

export interface PluginPackage {
  readonly format: typeof PACKAGE_FORMAT_VERSION;
  /** Untrusted until verified + validated. Parsed from the package JSON. */
  readonly manifest: unknown;
  /** The self-contained plugin module source that calls `nexine.definePlugin`. */
  readonly code: string;
  readonly signature: PackageSignature;
}

/**
 * The exact structure that gets canonicalized and signed. Binding the signer's
 * public key and key id into the signed bytes prevents an attacker from swapping
 * in a different key while keeping a valid-looking signature.
 */
export interface SigningEnvelope {
  readonly format: typeof PACKAGE_FORMAT_VERSION;
  readonly algorithm: typeof SIGNATURE_ALGORITHM;
  readonly publicKey: string;
  readonly keyId: string;
  readonly signedAt: number;
  readonly manifest: unknown;
  readonly code: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Structural guard — shape only, not signature validity (that is `verifyPackage`). */
export function isPluginPackage(value: unknown): value is PluginPackage {
  if (!isRecord(value)) return false;
  if (value.format !== PACKAGE_FORMAT_VERSION) return false;
  if (typeof value.code !== 'string') return false;
  if (!('manifest' in value)) return false;
  const sig = value.signature;
  if (!isRecord(sig)) return false;
  return (
    sig.algorithm === SIGNATURE_ALGORITHM &&
    typeof sig.publicKey === 'string' &&
    typeof sig.keyId === 'string' &&
    typeof sig.signedAt === 'number' &&
    typeof sig.value === 'string'
  );
}

/** Reconstruct the signed envelope from package fields, deterministically. */
export function envelopeFor(pkg: PluginPackage): SigningEnvelope {
  return {
    format: pkg.format,
    algorithm: pkg.signature.algorithm,
    publicKey: pkg.signature.publicKey,
    keyId: pkg.signature.keyId,
    signedAt: pkg.signature.signedAt,
    manifest: pkg.manifest,
    code: pkg.code,
  };
}
