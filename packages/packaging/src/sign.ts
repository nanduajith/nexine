/**
 * Assemble and sign a plugin package. Used by the `nexine` build tool after it has
 * bundled a plugin's entry module. The manifest is validated here too: we refuse
 * to sign something the host would reject, so a signed package always carries a
 * structurally valid manifest.
 */

import type { Result } from '@nexine/core';
import { err, ok } from '@nexine/core';
import { validateManifest } from '@nexine/sdk';

import { canonicalJson } from './canonical';
import { keyIdFromPublicKey, sign } from './crypto';
import { utf8ToBytes } from './encoding';
import {
  PACKAGE_FORMAT_VERSION,
  SIGNATURE_ALGORITHM,
  type PluginPackage,
  type SigningEnvelope,
} from './format';

export interface SignPackageInput {
  /** Manifest object (validated before signing). */
  readonly manifest: unknown;
  /** Bundled, self-contained plugin module source. */
  readonly code: string;
  /** Signer keypair as base64 SPKI / PKCS8 strings. */
  readonly publicKey: string;
  readonly privateKey: string;
  /** Override the signing timestamp (tests / reproducible builds). */
  readonly signedAt?: number;
}

/** Build the canonical bytes that a signature covers, for signing and verifying. */
export function signingBytes(envelope: SigningEnvelope): Uint8Array<ArrayBuffer> {
  return utf8ToBytes(canonicalJson(envelope));
}

export async function signPackage(input: SignPackageInput): Promise<Result<PluginPackage, string>> {
  const validation = validateManifest(input.manifest);
  if (!validation.ok) {
    const detail = validation.error
      .map((issue) => `${issue.path || 'manifest'}: ${issue.message}`)
      .join('; ');
    return err(`refusing to sign an invalid manifest — ${detail}`);
  }

  const keyId = await keyIdFromPublicKey(input.publicKey);
  const signedAt = input.signedAt ?? Date.now();

  // Sign the validated manifest so the signed bytes match exactly what the host
  // will re-validate, leaving no gap between "what was signed" and "what runs".
  const envelope: SigningEnvelope = {
    format: PACKAGE_FORMAT_VERSION,
    algorithm: SIGNATURE_ALGORITHM,
    publicKey: input.publicKey,
    keyId,
    signedAt,
    manifest: validation.value,
    code: input.code,
  };

  const value = await sign(signingBytes(envelope), input.privateKey);

  return ok({
    format: PACKAGE_FORMAT_VERSION,
    manifest: validation.value,
    code: input.code,
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      publicKey: input.publicKey,
      keyId,
      signedAt,
      value,
    },
  });
}
