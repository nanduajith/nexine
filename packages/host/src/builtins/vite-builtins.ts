import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import type { Plugin } from 'vite';

/**
 * Build-time bundler for builtin plugins. Every builtin lives in
 * `src/builtins/<id>/` as a `manifest.json` plus a typed `entry.ts`. This plugin
 * bundles each entry into a **self-contained IIFE classic script** — byte-for-byte
 * the same shape a side-loaded `.nexpkg` carries — and exposes them through the
 * virtual module `virtual:nexine-builtins`. The app then treats a builtin exactly
 * like an installed plugin: the only difference is that its source ships in-app.
 *
 * Bundling (not hand-written source strings) keeps builtins type-checked and lets
 * them reuse the pure `@nexine/tool-*` transforms with zero duplication. Nothing
 * is left as an unresolved import, so each builtin is a single reviewable artifact.
 */

const VIRTUAL_ID = 'virtual:nexine-builtins';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const BUILTINS_DIR = dirname(fileURLToPath(import.meta.url));

interface BuiltinDir {
  readonly id: string;
  readonly dir: string;
  readonly entry: string;
  readonly manifestPath: string;
}

/** Discover every `<id>/{manifest.json,entry.ts}` under the builtins directory. */
function discover(): BuiltinDir[] {
  return readdirSync(BUILTINS_DIR)
    .filter((name) => !name.startsWith('_') && statSync(join(BUILTINS_DIR, name)).isDirectory())
    .map((id) => {
      const dir = join(BUILTINS_DIR, id);
      return { id, dir, entry: join(dir, 'entry.ts'), manifestPath: join(dir, 'manifest.json') };
    })
    .filter((b) => {
      try {
        return statSync(b.entry).isFile() && statSync(b.manifestPath).isFile();
      } catch {
        return false;
      }
    });
}

async function bundleAll(minify: boolean): Promise<{ manifest: unknown; source: string }[]> {
  const builtins = discover();
  return Promise.all(
    builtins.map(async ({ entry, manifestPath }) => {
      const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const result = await build({
        entryPoints: [entry],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: 'es2020',
        write: false,
        legalComments: 'none',
        minify,
        external: [],
      });
      const output = result.outputFiles?.[0];
      if (!output) throw new Error(`builtin bundling produced no output for ${entry}`);
      return { manifest, source: output.text };
    }),
  );
}

export function builtinsPlugin(): Plugin {
  let minify = true;
  return {
    name: 'nexine-builtins',
    configResolved(config) {
      minify = config.command === 'build';
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return null;
      // Re-bundle on any builtin change during dev.
      for (const b of discover()) {
        this.addWatchFile(b.entry);
        this.addWatchFile(b.manifestPath);
      }
      const builtins = await bundleAll(minify);
      return `export const BUILTIN_SOURCES = ${JSON.stringify(builtins)};`;
    },
  };
}
