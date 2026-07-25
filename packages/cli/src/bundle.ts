/**
 * Bundle a plugin's source entry into a single, self-contained classic script.
 *
 * The output is an IIFE (no ESM import/export): the host injects plugin code as a
 * classic `<script>` under a per-plugin CSP nonce — dynamic `import()` and `eval`
 * are forbidden there — and the plugin registers itself by calling the global
 * `nexine.definePlugin(...)`. Bundling everything the entry references keeps the
 * package a single reviewable, signable artifact with no runtime module loading.
 */

import { build } from 'esbuild';

export interface BundleResult {
  readonly code: string;
  readonly bytes: number;
}

export async function bundlePlugin(entryPath: string, minify = true): Promise<BundleResult> {
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
    legalComments: 'none',
    minify,
    // A plugin must be self-contained; nothing may be left as an unresolved import.
    external: [],
  });

  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error('bundling produced no output');
  }
  return { code: output.text, bytes: output.contents.byteLength };
}
