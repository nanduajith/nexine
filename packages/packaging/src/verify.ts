/**
 * Verify a plugin package before it is allowed anywhere near the runtime. This is
 * the security gate for side-loading: it establishes integrity (the bytes were not
 * altered), authenticity (a specific key signed them), and separately reports
 * whether that key is trusted — leaving the trust *decision* to the host/policy.
 *
 * A cryptographically invalid or malformed package is a hard failure. A validly
 * signed package from an unpinned key succeeds with `trusted: false`, so the
 * caller can choose to warn-and-consent or block per governance mode.
 */

import type { Result } from '@nexine/core';
import { err, ok } from '@nexine/core';
import type { PluginManifest } from '@nexine/sdk';
import { validateManifest } from '@nexine/sdk';

import { keyIdFromPublicKey, verify } from './crypto';
import { envelopeFor, isPluginPackage, type PluginPackage } from './format';
import { signingBytes } from './sign';
import { findPublisher, EMPTY_TRUST_STORE, type TrustStore } from './trust-store';

export type VerificationFailure =
  | 'malformed' // not a well-formed package document
  | 'keyid-mismatch' // stated keyId does not derive from the public key
  | 'bad-signature' // signature does not verify over the package bytes
  | 'invalid-manifest'; // signature is valid but manifest fails validation

export interface VerificationError {
  readonly reason: VerificationFailure;
  readonly message: string;
}

export interface VerifiedPackage {
  readonly manifest: PluginManifest;
  readonly code: string;
  readonly signer: {
    readonly keyId: string;
    readonly publicKey: string;
    /** Present only when the signer is pinned in the trust store. */
    readonly label?: string;
  };
  /** True iff the signer's key is pinned in the supplied trust store. */
  readonly trusted: boolean;
  readonly signedAt: number;
}

export interface VerifyOptions {
  /** Trusted publisher keys. Defaults to empty (deny-by-default). */
  readonly trustStore?: TrustStore;
}

/**
 * Verify an untrusted package document (typically `JSON.parse` of a `.nexpkg`).
 */
export async function verifyPackage(
  value: unknown,
  options: VerifyOptions = {},
): Promise<Result<VerifiedPackage, VerificationError>> {
  if (!isPluginPackage(value)) {
    return fail('malformed', 'not a well-formed Nexine plugin package');
  }
  const pkg: PluginPackage = value;
  const { signature } = pkg;

  // The keyId is only a label, but it must be consistent with the key it names —
  // an inconsistency signals a hand-edited or corrupted package.
  const derivedKeyId = await keyIdFromPublicKey(signature.publicKey);
  if (derivedKeyId !== signature.keyId) {
    return fail('keyid-mismatch', 'signature keyId does not match its public key');
  }

  const valid = await verify(signingBytes(envelopeFor(pkg)), signature.value, signature.publicKey);
  if (!valid) {
    return fail('bad-signature', 'signature is not valid for this package');
  }

  // Only now — over verified bytes — do we trust the manifest enough to parse it.
  const manifest = validateManifest(pkg.manifest);
  if (!manifest.ok) {
    const detail = manifest.error
      .map((issue) => `${issue.path || 'manifest'}: ${issue.message}`)
      .join('; ');
    return fail('invalid-manifest', `manifest failed validation — ${detail}`);
  }

  const publisher = findPublisher(options.trustStore ?? EMPTY_TRUST_STORE, signature.publicKey);

  return ok({
    manifest: manifest.value,
    code: pkg.code,
    signer: {
      keyId: signature.keyId,
      publicKey: signature.publicKey,
      ...(publisher?.label ? { label: publisher.label } : {}),
    },
    trusted: publisher !== undefined,
    signedAt: signature.signedAt,
  });
}

function fail(reason: VerificationFailure, message: string): Result<never, VerificationError> {
  return err({ reason, message });
}
