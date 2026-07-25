/**
 * The tool categories Nexine organises around. Kept small and stable — new
 * tools should slot into an existing category before we add a new one.
 */
export type ToolCategory = 'encoding' | 'crypto' | 'web' | 'text' | 'data' | 'generators' | 'time';

/**
 * Framework-free metadata that describes a tool. This is the stable contract
 * every tool declares; the UI layer extends it with a React view (see
 * `ToolModule` in `@nexine/ui`). Keeping this pure means the registry, search,
 * and governance can reason about tools without pulling in any UI code.
 */
export interface ToolMeta {
  /** Stable, unique, kebab-case identifier (also used in the URL). */
  readonly id: string;
  /** Human-facing display name. */
  readonly name: string;
  /** One-line description shown in nav and the command palette. */
  readonly description: string;
  readonly category: ToolCategory;
  /** Extra terms to match in search beyond name/description. */
  readonly keywords: readonly string[];
  /**
   * Marks tools that routinely handle secrets/tokens (JWT, etc.). For these,
   * input history is NEVER persisted by default — the security posture must be
   * opt-in, not opt-out.
   */
  readonly sensitive?: boolean;
  /** Name of the icon the UI layer should render (resolved there, not here). */
  readonly icon?: string;
}
