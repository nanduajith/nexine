import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import type { Plugin } from 'vite';

// Relative import (not '@nexine/core') so Vite's esbuild config loader bundles
// this single file rather than resolving the package's TS entry through Node ESM.
import { buildSandboxDocumentCsp } from '../../../core/src/security/csp';

/**
 * Emits the plugin **sandbox document** and its guest runtime.
 *
 * Plugins run in an iframe pointed at a real, same-origin `sandbox.html` (not a
 * `srcdoc`/`blob:` document, which would inherit the app's strict `script-src
 * 'self'` and silently refuse the guest). This plugin produces two files that are
 * deliberately kept OUT of Vite's normal HTML pipeline — no React refresh
 * preamble, no app-CSP `<meta>` injection — so the sandbox document is governed
 * solely by its own CSP:
 *
 *   - `plugin-guest.js` — the host-trusted guest runtime, bundled as a classic
 *     script (loaded as `'self'`).
 *   - `sandbox.html`     — a fixed document carrying {@link buildSandboxDocumentCsp}
 *     and a mount root, which loads `plugin-guest.js`.
 *
 * Both are served from an in-dev middleware and emitted as assets in the build,
 * so `/sandbox.html` resolves identically in every environment.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const GUEST_ENTRY = join(HERE, 'guest-main.ts');

export const GUEST_FILE = 'plugin-guest.js';
export const SANDBOX_FILE = 'sandbox.html';

async function bundleGuest(minify: boolean): Promise<string> {
  const result = await build({
    entryPoints: [GUEST_ENTRY],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
    legalComments: 'none',
    minify,
  });
  const output = result.outputFiles?.[0];
  if (!output) throw new Error('sandbox guest bundling produced no output');
  return output.text;
}

function sandboxHtml(): string {
  const csp = buildSandboxDocumentCsp();
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    '<title>Nexine plugin sandbox</title>',
    '</head>',
    // Transparent + dark color-scheme so an empty/loading sandbox matches the host.
    '<body style="margin:0;background:transparent;color-scheme:dark">',
    '<div id="nx-plugin-root"></div>',
    // Relative src so it resolves under any base path (root, /nexine/app/, …).
    `<script src="./${GUEST_FILE}"></script>`,
    '</body>',
    '</html>',
  ].join('');
}

export function sandboxPlugin(): Plugin {
  let minify = true;
  return {
    name: 'nexine-sandbox',
    configResolved(config) {
      minify = config.command === 'build';
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0] ?? '';
        if (path.endsWith(`/${SANDBOX_FILE}`) || path === `/${SANDBOX_FILE}`) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(sandboxHtml());
          return;
        }
        if (path.endsWith(`/${GUEST_FILE}`) || path === `/${GUEST_FILE}`) {
          void bundleGuest(false).then(
            (js) => {
              res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
              res.end(js);
            },
            (error: unknown) => {
              res.statusCode = 500;
              res.end(`/* sandbox guest build failed: ${String(error)} */`);
            },
          );
          return;
        }
        next();
      });
    },
    async generateBundle() {
      const js = await bundleGuest(minify);
      this.emitFile({ type: 'asset', fileName: GUEST_FILE, source: js });
      this.emitFile({ type: 'asset', fileName: SANDBOX_FILE, source: sandboxHtml() });
    },
  };
}
