import type { PluginManifest } from '@nexine/sdk';
import type { ToolModule } from '@nexine/ui';

import { toBuiltinToolModule, type BuiltinSetup } from '../features/tools/builtin-tool';

/**
 * The first-party tools that ship with the app. Each lives in `src/builtins/<id>/`
 * as a `manifest.json` plus a typed `entry.ts` whose default export is the tool's
 * `setup`. They are discovered and imported as normal ES modules (compiled into the
 * bundle) and rendered **in-process** — no iframe, no plugin runtime. Adding a tool
 * is just a new `<id>/` folder; nothing here needs editing.
 */
const setups = import.meta.glob('./*/entry.ts', {
  eager: true,
  import: 'default',
}) as Record<string, BuiltinSetup>;

const manifests = import.meta.glob('./*/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, PluginManifest>;

interface Builtin {
  readonly manifest: PluginManifest;
  readonly setup: BuiltinSetup;
}

/** `'./jwt/entry.ts'` → `'jwt'`. */
function idFromEntryPath(path: string): string {
  const id = path.split('/')[1];
  if (!id) throw new Error(`unexpected builtin entry path: ${path}`);
  return id;
}

const builtins: readonly Builtin[] = Object.entries(setups)
  .map(([path, setup]) => {
    const id = idFromEntryPath(path);
    const manifest = manifests[`./${id}/manifest.json`];
    if (!manifest) throw new Error(`builtin '${id}' is missing manifest.json`);
    return { manifest, setup };
  })
  .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

/** Every first-party tool, as shared `ToolModule`s the shell renders and routes over. */
export const BUILTIN_TOOLS: readonly ToolModule[] = builtins.map((b) =>
  toBuiltinToolModule(b.manifest, b.setup),
);

/** Compact metadata for the Settings "Builtins" panel. */
export interface BuiltinInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export const BUILTIN_INFO: readonly BuiltinInfo[] = builtins.map(({ manifest }) => ({
  id: manifest.id,
  name: manifest.name,
  description: manifest.description,
}));
