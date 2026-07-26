import type { PluginAdapter } from './plugin-adapter.types';

/**
 * Web tier: third-party plugins do not exist. This stub imports **nothing** from
 * the plugin runtime, packaging or sandbox, so none of that machinery can enter
 * the web bundle. Enforced by the build-time swap in `vite.config.ts` and guarded
 * in CI (the web `dist` must contain no plugin artifacts).
 */
export const pluginAdapter: PluginAdapter = {
  supportsPlugins: false,
  installedToolModules: () => [],
  settingsSections: [],
};
