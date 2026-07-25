import type { PluginManifest } from '@nexine/sdk';

import type { InstalledPackage } from '../../infrastructure/storage/governance-store';

import type { BuiltinPlugin } from './builtin-plugins';

/**
 * The two kinds of plugin the host can run as a first-class tool. Both surface
 * identically in the sidebar and both execute in the sandbox; they differ only in
 * provenance and how they are mounted:
 *
 * - `package` — a signed `.nexpkg` the user side-loaded. Its signature is
 *   re-verified against the trust store on every mount.
 * - `builtin` — a bundled plugin that ships with the app. Unsigned by design (it
 *   is app code), it mounts straight from its source.
 *
 * `manifest` is pulled out so callers building sidebar metadata never touch the
 * untyped stored document.
 */
export type PluginToolSource =
  | {
      readonly kind: 'package';
      readonly record: InstalledPackage;
      readonly manifest: PluginManifest;
    }
  | { readonly kind: 'builtin'; readonly plugin: BuiltinPlugin; readonly manifest: PluginManifest };
