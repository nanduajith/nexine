import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type PluginOption } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

// Imported by relative path (not '@nexine/core') so Vite's esbuild config loader
// bundles this single, self-contained file rather than resolving the package's
// TS entry through Node ESM. Still the one source of truth for the policy.
import { buildContentSecurityPolicy } from '../core/src/security/csp';

import { sandboxPlugin } from './src/sandbox/vite-sandbox';

/**
 * Build target. The web tier (`web`, the default) is a static PWA of first-party
 * tools only; the desktop tier (`desktop`, set by the Tauri build/dev scripts)
 * additionally ships the third-party plugin subsystem. The split is what keeps the
 * web bundle free of any plugin machinery.
 */
const TARGET = process.env['NEXINE_TARGET'] === 'desktop' ? 'desktop' : 'web';

/**
 * Injects the Content-Security-Policy as a <meta> tag into index.html. Production
 * gets the strict no-egress policy (connect-src 'none'); dev relaxes only what
 * HMR needs. This is the enforcement point for Nexine's no-egress guarantee.
 */
function cspPlugin(isDev: boolean): Plugin {
  return {
    name: 'nexine-csp',
    transformIndexHtml(html) {
      const csp = buildContentSecurityPolicy({ dev: isDev, desktop: TARGET === 'desktop' });
      const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
      return html.replace('</head>', `    ${meta}\n  </head>`);
    },
  };
}

/**
 * On the web build, rewrite the plugin adapter's `./plugin-adapter.desktop` import
 * to the web stub, so the desktop module (and the plugin runtime, packaging and
 * sandbox it pulls in) is never linked into the web bundle. This is the primary
 * exclusion mechanism — the plugin machinery is unreachable by construction, not
 * left to dead-code elimination.
 */
function pluginAdapterSwap(): Plugin {
  const webImpl = fileURLToPath(
    new URL('./src/infrastructure/platform/plugin-adapter.web.ts', import.meta.url),
  );
  return {
    name: 'nexine-plugin-adapter-swap',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (TARGET !== 'desktop' && /plugin-adapter\.desktop$/.test(source)) {
        return this.resolve(webImpl, importer, { ...options, skipSelf: true });
      }
      return null;
    },
  };
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const plugins: PluginOption[] = [
    tsconfigPaths(),
    react(),
    tailwindcss(),
    nodePolyfills(),
    cspPlugin(isDev),
    pluginAdapterSwap(),
  ];
  // The sandbox document + guest runtime exist only for third-party plugins, which
  // are desktop-only — the web build emits neither sandbox.html nor plugin-guest.js.
  if (TARGET === 'desktop') plugins.push(sandboxPlugin());

  return {
    // Served from the origin root by default (desktop app, Docker/nginx self-host,
    // dev). The GitHub Pages *demo* build overrides this to its subpath via
    // NEXINE_BASE=/nexine/app/ so asset URLs resolve under the project site.
    base: process.env['NEXINE_BASE'] ?? '/',
    cacheDir: `node_modules/.vite-${TARGET}`,
    plugins,
    define: { __NEXINE_DESKTOP__: JSON.stringify(TARGET === 'desktop') },
    server: { port: 5273 },
    preview: { port: 4273 },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  };
});
