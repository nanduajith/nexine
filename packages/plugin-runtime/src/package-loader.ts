/**
 * The trust pipeline for a *signed* plugin package, extending the manifest-only
 * pipeline in `plugin-host.ts` with a signature+trust gate at the front. This is
 * what the host uses for side-loaded `.nexpkg` files: verify the signature (proves
 * the bytes are intact and who signed them) and resolve whether that signer is
 * trusted, *before* the manifest is validated, permissions are resolved, or any
 * iframe is created.
 *
 * Verification is re-run every time — on preview *and* on each mount — so a stored
 * package can never be trusted on the basis of a cached result.
 */

import { verifyPackage, type TrustStore, type VerificationFailure } from '@nexine/packaging';
import type { PluginManifest } from '@nexine/sdk';

import type { PermissionResolution, PluginPolicy } from './permission-engine';
import { inspectPlugin, loadPlugin, type LoadPluginResult } from './plugin-host';
import type { KeyValueBackend } from './services';

export interface PackageSigner {
  readonly keyId: string;
  readonly publicKey: string;
  /** Present only when the signer is pinned in the trust store. */
  readonly label?: string;
  /** True iff the signer's key is pinned in the supplied trust store. */
  readonly trusted: boolean;
}

export interface InspectPackageInput {
  /** Untrusted package document (typically `JSON.parse` of a `.nexpkg`). */
  readonly package: unknown;
  readonly trustStore?: TrustStore;
  readonly policy?: PluginPolicy;
}

export type InspectPackageResult =
  | {
      readonly ok: true;
      readonly signer: PackageSigner;
      readonly manifest: PluginManifest;
      readonly code: string;
      readonly resolution: PermissionResolution;
    }
  | {
      readonly ok: false;
      /** Which gate rejected the package. */
      readonly stage: 'signature' | 'policy';
      readonly error: string;
      /** Set for signature failures, to distinguish tamper from a bad document. */
      readonly reason?: VerificationFailure;
      /** Present when the signature verified but a later gate rejected it. */
      readonly signer?: PackageSigner;
      readonly resolution?: PermissionResolution;
    };

/**
 * Verify a package and resolve it against policy *without side effects* — no
 * iframe, no services. Drives the side-load preview/consent screen.
 */
export async function inspectPackage(input: InspectPackageInput): Promise<InspectPackageResult> {
  const verified = await verifyPackage(input.package, {
    ...(input.trustStore ? { trustStore: input.trustStore } : {}),
  });
  if (!verified.ok) {
    return {
      ok: false,
      stage: 'signature',
      error: verified.error.message,
      reason: verified.error.reason,
    };
  }

  const signer: PackageSigner = {
    keyId: verified.value.signer.keyId,
    publicKey: verified.value.signer.publicKey,
    trusted: verified.value.trusted,
    ...(verified.value.signer.label ? { label: verified.value.signer.label } : {}),
  };

  // Re-validate + resolve permissions through the shared, single trust pipeline.
  const inspected = inspectPlugin({
    manifest: verified.value.manifest,
    ...(input.policy ? { policy: input.policy } : {}),
  });
  if (!inspected.ok) {
    return {
      ok: false,
      stage: 'policy',
      error: inspected.error,
      signer,
      ...(inspected.resolution ? { resolution: inspected.resolution } : {}),
    };
  }

  return {
    ok: true,
    signer,
    manifest: inspected.manifest,
    code: verified.value.code,
    resolution: inspected.resolution,
  };
}

export interface LoadPackageInput extends InspectPackageInput {
  /** URL of the app's static sandbox document (e.g. `${BASE_URL}sandbox.html`). */
  readonly sandboxDocUrl: string;
  readonly storageBackend?: KeyValueBackend;
  readonly onFatal?: (message: string) => void;
}

export type LoadPackageResult =
  | (Extract<LoadPluginResult, { ok: true }> & { readonly signer: PackageSigner })
  | {
      readonly ok: false;
      readonly stage: 'signature' | 'policy';
      readonly error: string;
      readonly reason?: VerificationFailure;
    };

/**
 * Verify a package and, if it passes, create its sandbox. Every mount re-verifies
 * the signature, so a tampered stored package is caught even after install.
 */
export async function loadPackage(input: LoadPackageInput): Promise<LoadPackageResult> {
  const inspected = await inspectPackage(input);
  if (!inspected.ok) {
    return inspected.reason !== undefined
      ? { ok: false, stage: inspected.stage, error: inspected.error, reason: inspected.reason }
      : { ok: false, stage: inspected.stage, error: inspected.error };
  }

  const loaded = loadPlugin({
    manifest: inspected.manifest,
    pluginSource: inspected.code,
    sandboxDocUrl: input.sandboxDocUrl,
    ...(input.policy ? { policy: input.policy } : {}),
    ...(input.storageBackend ? { storageBackend: input.storageBackend } : {}),
    ...(input.onFatal ? { onFatal: input.onFatal } : {}),
  });
  if (!loaded.ok) {
    // Policy can only have changed between inspect and load; treat as a policy stop.
    return { ok: false, stage: 'policy', error: loaded.error };
  }

  return { ...loaded, signer: inspected.signer };
}
