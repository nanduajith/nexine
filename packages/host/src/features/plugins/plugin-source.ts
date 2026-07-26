import type { PluginManifest } from '@nexine/sdk';

import type { InstalledPackage } from '../../infrastructure/storage/governance-store';

/**
 * A third-party plugin the host can run as a first-class tool: a signed `.nexpkg`
 * the user side-loaded. Its signature is re-verified against the trust store on
 * every mount, and it always executes in the governed sandbox. (First-party tools
 * are not plugins — they render in-process; see `features/tools`.)
 *
 * `manifest` is pulled out so callers building sidebar metadata never touch the
 * untyped stored document.
 */
export interface PluginToolSource {
  readonly kind: 'package';
  readonly record: InstalledPackage;
  readonly manifest: PluginManifest;
}
