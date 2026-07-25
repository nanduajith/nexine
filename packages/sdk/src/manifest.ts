import type { ToolCategory } from '@nexine/core';

import type { DataFlow } from './data-flow';
import type { Permission } from './permissions';

/**
 * The plugin manifest is the security-load-bearing artifact. The host reads and
 * validates it *before executing any plugin code* — the manifest's declared
 * permissions determine the CSP the plugin's iframe is created with. Because the
 * declaration precedes and constrains the code, a plugin cannot grant itself a
 * capability at runtime.
 *
 * It is deliberately a plain, serializable object (shippable as `manifest.json`)
 * with no executable content.
 */
export interface PluginManifest {
  /** Schema version. Bumped only on breaking changes; the host refuses unknown versions. */
  readonly manifestVersion: 1;
  /** Globally unique, stable identifier (reverse-DNS or kebab-case), e.g. `dev.acme.csv`. */
  readonly id: string;
  /** Human-facing display name. */
  readonly name: string;
  /** Semver version of the plugin. */
  readonly version: string;
  /** One-line description shown in nav, search and consent. */
  readonly description: string;
  /** Category the tool slots into (shared vocabulary with first-party tools). */
  readonly category: ToolCategory;
  /** Optional author/publisher label. */
  readonly author?: string;
  /** Extra search terms beyond name/description. */
  readonly keywords?: readonly string[];
  /** Icon name the host resolves (same registry as first-party tools). */
  readonly icon?: string;
  /** Marks tools that handle secrets; history/telemetry stays off by default. */
  readonly sensitive?: boolean;
  /**
   * Capabilities the plugin requests. Omitted or empty means a fully sandboxed,
   * zero-egress tool — the safest and most common case.
   */
  readonly permissions?: readonly Permission[];
  /** Plain-language egress declarations, required when `network` is requested. */
  readonly dataFlows?: readonly DataFlow[];
  /**
   * Relative path (within the plugin package) to the ES module entry that calls
   * `definePlugin`. Resolved by the loader; never an absolute or remote URL.
   */
  readonly entry: string;
}

/** The current manifest schema version the host understands. */
export const MANIFEST_VERSION = 1 as const;
