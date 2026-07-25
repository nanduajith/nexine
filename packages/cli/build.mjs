import { chmodSync } from 'node:fs';

import { build } from 'esbuild';

/**
 * Bundle the `nexine` CLI into a single, self-contained Node ESM executable.
 *
 * Everything the CLI references — the workspace `@nexine/*` packages and their
 * transitive code — is inlined, so the published `dist/bin.js` runs from a plain
 * `node` with no dependency on the monorepo's TS resolver. Node built-ins stay
 * external (esbuild's `platform: 'node'` handles that). This is what makes the
 * `nexine` bin work as a real binary rather than only under `tsx`/`vitest`.
 */
await build({
  entryPoints: ['src/bin.ts'],
  outfile: 'dist/bin.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  banner: { js: '#!/usr/bin/env node' },
  minify: false,
  // esbuild ships a native binary and is loaded at runtime by `pack`; it can't be
  // inlined, so it stays an external dependency resolved from node_modules.
  external: ['esbuild'],
});

// The banner adds the shebang; make the output directly executable.
chmodSync('dist/bin.js', 0o755);

console.log('built dist/bin.js');
