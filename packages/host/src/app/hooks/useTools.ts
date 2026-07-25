import { createToolRegistry, type ToolCategory, type ToolRegistry } from '@nexine/core';
import type { PluginManifest } from '@nexine/sdk';
import type { ToolModule } from '@nexine/ui';
import { useMemo } from 'react';

import { BUILTIN_PLUGINS } from '../../features/plugins/builtin-plugins';
import { toPluginToolModule } from '../../features/plugins/plugin-tool';

import { useGovernance } from './useGovernance';

/** The assembled, live tool set the shell renders and routes over. */
export interface ToolSections {
  /** All enabled tools — drives routing and the ⌘K palette. */
  readonly registry: ToolRegistry<ToolModule>;
  /** Enabled tools grouped by category, in display order (sidebar). */
  readonly categoryGroups: ReadonlyArray<readonly [ToolCategory, readonly ToolModule[]]>;
  /** Every enabled tool, flat — used to resolve favorites. */
  readonly allTools: readonly ToolModule[];
}

/**
 * Single source of truth for what tools exist right now. Every tool — builtin or
 * side-loaded — is a sandboxed plugin, assembled here into one registry: builtins
 * (filtered by the user's removed set) plus installed packages. Builtin ids win on
 * an (unexpected) collision, so an installed package can never shadow a builtin.
 */
export function useTools(): ToolSections {
  const governance = useGovernance();

  return useMemo(() => {
    const removed = new Set(governance.disabledBuiltins);

    const builtinTools = BUILTIN_PLUGINS.filter((plugin) => !removed.has(plugin.manifest.id)).map(
      (plugin) => toPluginToolModule({ kind: 'builtin', plugin, manifest: plugin.manifest }),
    );
    const installedTools = Object.values(governance.installed).map((record) =>
      toPluginToolModule({
        kind: 'package',
        record,
        manifest: record.package.manifest as PluginManifest,
      }),
    );

    const seen = new Set<string>();
    const allTools: ToolModule[] = [];
    for (const tool of [...builtinTools, ...installedTools]) {
      if (seen.has(tool.id)) continue;
      seen.add(tool.id);
      allTools.push(tool);
    }

    const registry = createToolRegistry<ToolModule>(allTools);
    return { registry, categoryGroups: registry.byCategory(), allTools };
  }, [governance.disabledBuiltins, governance.installed]);
}
