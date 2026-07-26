import type { ToolModule } from '@nexine/ui';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

import type { GovernanceState } from '../storage/governance-store';

/** A Settings surface contributed by the plugin adapter (desktop only). */
export interface PluginSettingsSection {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  /** `plugins` sections sort before Builtins; `governance` sections after. */
  readonly group: 'plugins' | 'governance';
  readonly component: ComponentType;
}

/**
 * The seam that keeps third-party plugins a **desktop-only** capability. The web
 * tier ships a stub implementation (see `plugin-adapter.web.ts`) that supports no
 * plugins at all; the desktop build swaps in `plugin-adapter.desktop.ts`, which
 * pulls in the plugin runtime, packaging and sandbox. The swap happens at build
 * time in `vite.config.ts` so the web bundle never even parses the desktop module
 * — the plugin machinery is unreachable by construction, not merely tree-shaken.
 */
export interface PluginAdapter {
  /** Whether this build can load third-party plugins (desktop only). */
  readonly supportsPlugins: boolean;
  /**
   * Installed third-party plugins, adapted into the shared `ToolModule` shape so
   * they appear in the sidebar/palette alongside first-party tools. Web: `[]`.
   */
  installedToolModules(governance: GovernanceState): ToolModule[];
  /** Extra Settings surfaces (side-load, publisher trust, egress). Web: `[]`. */
  readonly settingsSections: readonly PluginSettingsSection[];
  /**
   * Build the sandbox document URL for a specific plugin, carrying per-plugin CSP
   * parameters. Desktop returns a `nexine-sandbox://` custom-protocol URL; web
   * does not implement this (web has no plugins). Falls back to the static
   * `sandbox.html` when not provided.
   */
  sandboxDocUrlFor?(pluginId: string, grantedHosts: readonly string[]): string;
}
