import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Imported by relative path (not '@nexine/core') so Vite's esbuild config loader
// bundles this single, self-contained file rather than resolving the package's
// TS entry through Node ESM. Still the one source of truth for the policy.
import { buildContentSecurityPolicy } from '../core/src/security/csp';

import { builtinsPlugin } from './src/builtins/vite-builtins';
import { sandboxPlugin } from './src/sandbox/vite-sandbox';

/**
 * Injects the Content-Security-Policy as a <meta> tag into index.html. Production
 * gets the strict no-egress policy (connect-src 'none'); dev relaxes only what
 * HMR needs. This is the enforcement point for Nexine's no-egress guarantee.
 */
function cspPlugin(isDev: boolean): Plugin {
  return {
    name: 'nexine-csp',
    transformIndexHtml(html) {
      const csp = buildContentSecurityPolicy({ dev: isDev });
      const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
      return html.replace('</head>', `    ${meta}\n  </head>`);
    },
  };
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  return {
    // Served from the origin root by default (desktop app, Docker/nginx self-host,
    // dev). The GitHub Pages *demo* build overrides this to its subpath via
    // NEXINE_BASE=/nexine/app/ so asset URLs resolve under the project site.
    base: process.env['NEXINE_BASE'] ?? '/',
    plugins: [
      tsconfigPaths(),
      react(),
      tailwindcss(),
      cspPlugin(isDev),
      builtinsPlugin(),
      sandboxPlugin(),
    ],
    server: { port: 5273 },
    preview: { port: 4273 },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  };
});
