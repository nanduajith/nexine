import type { PluginManifest } from '@nexine/sdk';
import { BUILTIN_SOURCES } from 'virtual:nexine-builtins';

/**
 * The builtins that ship with the app — the first-party tools and the example
 * plugins. Each is a fully self-contained plugin: a manifest plus an IIFE source
 * bundled from `src/builtins/<id>/entry.ts` at build time (see `vite-builtins.ts`).
 * They run through the *identical* sandbox path as any side-loaded package; the
 * only difference is that their source ships inside the app. There is no
 * privileged in-process tool path.
 */
export interface BuiltinPlugin {
  readonly manifest: PluginManifest;
  /** Self-contained classic script; calls the injected `nexine.definePlugin`. */
  readonly source: string;
}

export const BUILTIN_PLUGINS: readonly BuiltinPlugin[] = BUILTIN_SOURCES;
