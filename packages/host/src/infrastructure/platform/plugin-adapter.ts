/**
 * The plugin adapter entry point every caller imports. It re-exports the desktop
 * implementation by default (so TypeScript sees the full surface); the web build
 * rewrites the `./plugin-adapter.desktop` specifier to `./plugin-adapter.web` in
 * `vite.config.ts`, so the web bundle links the stub instead and never pulls in
 * any plugin machinery.
 */
export type { PluginAdapter } from './plugin-adapter.types';
export { pluginAdapter } from './plugin-adapter.desktop';
