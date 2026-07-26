import { Network, PackageOpen, ShieldAlert } from 'lucide-react';

import { DesktopUpsell } from '../../features/marketing/DesktopUpsell';

import type { PluginAdapter } from './plugin-adapter.types';

/**
 * Web tier: third-party plugins do not exist. This stub imports **nothing** from
 * the plugin runtime, packaging or sandbox, so none of that machinery can enter
 * the web bundle. Enforced by the build-time swap in `vite.config.ts` and guarded
 * in CI (the web `dist` must contain no plugin artifacts).
 *
 * Instead of functional plugin panels, it returns marketing placeholders for the
 * Settings view to encourage downloading the desktop app.
 */
export const pluginAdapter: PluginAdapter = {
  supportsPlugins: false,
  installedToolModules: () => [],
  settingsSections: [
    {
      id: 'plugins',
      label: 'Plugins',
      description: 'Side-load and manage third-party tools.',
      icon: PackageOpen,
      group: 'plugins',
      component: DesktopUpsell,
    },
    {
      id: 'trust',
      label: 'Publisher trust',
      description: 'Control which developers are allowed to run code on your device.',
      icon: ShieldAlert,
      group: 'governance',
      component: DesktopUpsell,
    },
    {
      id: 'egress',
      label: 'Network egress',
      description: 'Strict, per-plugin control over network access.',
      icon: Network,
      group: 'governance',
      component: DesktopUpsell,
    },
  ],
};
