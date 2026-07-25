import { BUILTIN_PLUGINS } from './builtin-plugins';

/**
 * Display metadata for the Settings "Builtins" panel. Every builtin is a
 * sandboxed plugin now, so there is no per-kind distinction — the panel just
 * lists them with enable/remove. Derived straight from the bundled catalog.
 */
export interface BuiltinInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export const BUILTINS: readonly BuiltinInfo[] = BUILTIN_PLUGINS.map(
  ({ manifest }): BuiltinInfo => ({
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
  }),
);
