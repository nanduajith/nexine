declare module 'virtual:nexine-builtins' {
  import type { PluginManifest } from '@nexine/sdk';

  /** Each builtin: its manifest plus a self-contained IIFE plugin source. */
  export const BUILTIN_SOURCES: readonly {
    readonly manifest: PluginManifest;
    readonly source: string;
  }[];
}
