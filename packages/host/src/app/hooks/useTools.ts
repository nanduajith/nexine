import { createToolRegistry, type ToolCategory, type ToolRegistry } from '@nexine/core';
import type { ToolModule } from '@nexine/ui';
import { useMemo } from 'react';

import { BUILTIN_TOOLS } from '../../builtins';
import { pluginAdapter } from '../../infrastructure/platform/plugin-adapter';

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
 * Single source of truth for what tools exist right now, assembled into one
 * registry: first-party builtins (rendered in-process, filtered by the user's
 * removed set) plus any installed third-party plugins (desktop only — the web
 * adapter contributes none). Builtin ids win on an (unexpected) collision, so an
 * installed plugin can never shadow a builtin.
 */
export function useTools(): ToolSections {
  const governance = useGovernance();

  return useMemo(() => {
    const removed = new Set(governance.disabledBuiltins);

    const builtinTools = BUILTIN_TOOLS.filter((tool) => !removed.has(tool.id));
    const installedTools = pluginAdapter.installedToolModules(governance);

    const seen = new Set<string>();
    const allTools: ToolModule[] = [];
    for (const tool of [...builtinTools, ...installedTools]) {
      if (seen.has(tool.id)) continue;
      seen.add(tool.id);
      allTools.push(tool);
    }

    const registry = createToolRegistry<ToolModule>(allTools);
    return { registry, categoryGroups: registry.byCategory(), allTools };
  }, [governance]);
}
