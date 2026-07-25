import { CATEGORIES } from './categories';
import { searchTools } from './search';
import type { ToolCategory, ToolMeta } from './types';

/**
 * A generic, framework-free registry of tools. It is parameterised over the
 * concrete tool type so the domain core never needs to know that tools carry a
 * React view — the host instantiates it with the UI-facing `ToolModule` type.
 */
export interface ToolRegistry<T extends ToolMeta> {
  register(tool: T): void;
  registerAll(tools: readonly T[]): void;
  get(id: string): T | undefined;
  has(id: string): boolean;
  all(): readonly T[];
  /** Tools grouped by category, in category display order. */
  byCategory(): ReadonlyArray<readonly [ToolCategory, readonly T[]]>;
  search(query: string): readonly T[];
}

class DefaultToolRegistry<T extends ToolMeta> implements ToolRegistry<T> {
  private readonly tools = new Map<string, T>();

  constructor(initial?: readonly T[]) {
    if (initial) this.registerAll(initial);
  }

  register(tool: T): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Duplicate tool id registered: "${tool.id}"`);
    }
    this.tools.set(tool.id, tool);
  }

  registerAll(tools: readonly T[]): void {
    for (const tool of tools) this.register(tool);
  }

  get(id: string): T | undefined {
    return this.tools.get(id);
  }

  has(id: string): boolean {
    return this.tools.has(id);
  }

  all(): readonly T[] {
    return [...this.tools.values()];
  }

  byCategory(): ReadonlyArray<readonly [ToolCategory, readonly T[]]> {
    const grouped = new Map<ToolCategory, T[]>();
    for (const tool of this.tools.values()) {
      const bucket = grouped.get(tool.category);
      if (bucket) bucket.push(tool);
      else grouped.set(tool.category, [tool]);
    }

    return CATEGORIES.filter((category) => grouped.has(category.id)).map((category) => {
      const bucket = grouped.get(category.id) ?? [];
      const sorted = [...bucket].sort((a, b) => a.name.localeCompare(b.name));
      return [category.id, sorted] as const;
    });
  }

  search(query: string): readonly T[] {
    return searchTools(this.all(), query);
  }
}

export function createToolRegistry<T extends ToolMeta>(initial?: readonly T[]): ToolRegistry<T> {
  return new DefaultToolRegistry<T>(initial);
}
