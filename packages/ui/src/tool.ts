import type { ToolMeta } from '@nexine/core';
import type { ComponentType } from 'react';

/**
 * Props every tool view receives from the host. Deliberately minimal today —
 * this is the seam that becomes the public plugin SDK in Phase 2, so we keep it
 * small and stable. The host owns all I/O (storage, clipboard); a tool is, for
 * now, a pure function of user input rendered through React.
 */
export interface ToolViewProps {
  /** The tool's own metadata, for convenience. */
  readonly meta: ToolMeta;
}

/**
 * A first-party tool: framework-free metadata (from `@nexine/core`) plus a React
 * view. Every tool in `tools/*` default-exports one of these. Because the view
 * only depends on this contract and the design system — never on host internals —
 * a tool is identical whether it ships first-party today or as a sandboxed plugin
 * tomorrow.
 */
export interface ToolModule extends ToolMeta {
  readonly view: ComponentType<ToolViewProps>;
}

/** Small helper for authoring a tool module with inference and validation intact. */
export function defineTool(module: ToolModule): ToolModule {
  return module;
}
