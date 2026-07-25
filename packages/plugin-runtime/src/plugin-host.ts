import type { ManifestIssue, PluginManifest } from '@nexine/sdk';
import { validateManifest } from '@nexine/sdk';

import {
  DEFAULT_POLICY,
  resolvePermissions,
  type PermissionResolution,
  type PluginPolicy,
} from './permission-engine';
import { createPluginSandbox, type PluginSandbox } from './sandbox';
import { createHostServices, type KeyValueBackend } from './services';

/**
 * The single entry point for loading a plugin. It runs the full trust pipeline in
 * order — validate the untrusted manifest, resolve permissions against policy,
 * refuse to load if policy forbids it, then create the sandbox — so a caller
 * cannot accidentally skip a security step.
 */

export interface LoadPluginInput {
  /** Untrusted manifest object (e.g. parsed from `manifest.json`). */
  readonly manifest: unknown;
  /** The plugin's self-contained ES module source. */
  readonly pluginSource: string;
  /** Active governance policy; defaults to the permissive individual-developer policy. */
  readonly policy?: PluginPolicy;
  /** Storage backend override (tests / desktop); defaults to `localStorage`. */
  readonly storageBackend?: KeyValueBackend;
  readonly onFatal?: (message: string) => void;
}

export type InspectPluginResult =
  | {
      readonly ok: true;
      readonly manifest: PluginManifest;
      readonly resolution: PermissionResolution;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly issues?: readonly ManifestIssue[];
      readonly resolution?: PermissionResolution;
    };

/**
 * Validate and resolve a plugin *without any side effects* — no iframe, no
 * services. This is what the consent gate calls to show the user exactly what a
 * plugin declares and what policy would grant, before anything runs.
 */
export function inspectPlugin(input: {
  readonly manifest: unknown;
  readonly policy?: PluginPolicy;
}): InspectPluginResult {
  const parsed = validateManifest(input.manifest);
  if (!parsed.ok) {
    return { ok: false, error: 'manifest failed validation', issues: parsed.error };
  }
  const manifest = parsed.value;
  const resolution = resolvePermissions(manifest, input.policy ?? DEFAULT_POLICY);
  if (!resolution.allowedToLoad) {
    return { ok: false, error: resolution.loadReason, resolution };
  }
  return { ok: true, manifest, resolution };
}

export type LoadPluginResult =
  | {
      readonly ok: true;
      readonly sandbox: PluginSandbox;
      readonly manifest: PluginManifest;
      readonly resolution: PermissionResolution;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly issues?: readonly ManifestIssue[];
      readonly resolution?: PermissionResolution;
    };

export function loadPlugin(input: LoadPluginInput): LoadPluginResult {
  const inspected = inspectPlugin(input);
  if (!inspected.ok) {
    return inspected.issues
      ? { ok: false, error: inspected.error, issues: inspected.issues }
      : {
          ok: false,
          error: inspected.error,
          ...(inspected.resolution ? { resolution: inspected.resolution } : {}),
        };
  }
  const { manifest, resolution } = inspected;

  const services = createHostServices(
    manifest.id,
    input.storageBackend ? { storageBackend: input.storageBackend } : {},
  );

  const sandbox = createPluginSandbox({
    manifest,
    granted: resolution.granted,
    pluginSource: input.pluginSource,
    services,
    ...(input.onFatal ? { onFatal: input.onFatal } : {}),
  });

  return { ok: true, sandbox, manifest, resolution };
}
