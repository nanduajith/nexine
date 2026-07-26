import type { PluginManifest } from '@nexine/sdk';
import { Globe, Puzzle, ShieldCheck } from 'lucide-react';

import { EgressPanel, PluginsSection, TrustPanel } from '../../features/plugins/PluginSettings';
import { toPluginToolModule } from '../../features/plugins/plugin-tool';
import type { GovernanceState } from '../storage/governance-store';

import type { PluginAdapter } from './plugin-adapter.types';

/**
 * Desktop tier: the full third-party plugin capability — installed packages become
 * tools (each running in its governed sandbox), and Settings gains the side-load,
 * publisher-trust and egress surfaces. This module (and everything it imports) is
 * excluded from the web build by the swap in `vite.config.ts`.
 */
export const pluginAdapter: PluginAdapter = {
  supportsPlugins: true,
  installedToolModules: (governance: GovernanceState) =>
    Object.values(governance.installed).map((record) =>
      toPluginToolModule({
        kind: 'package',
        record,
        manifest: record.package.manifest as PluginManifest,
      }),
    ),
  settingsSections: [
    {
      id: 'plugins',
      label: 'Plugins',
      description:
        'Side-load signed plugins and manage what you have installed. Each runs in its own sandbox from the tool list — never here.',
      icon: Puzzle,
      group: 'plugins',
      component: PluginsSection,
    },
    {
      id: 'trust',
      label: 'Publisher trust',
      description:
        'Pin the public keys you trust to sign plugins. A valid signature alone never implies trust — that decision is yours.',
      icon: ShieldCheck,
      group: 'governance',
      component: TrustPanel,
    },
    {
      id: 'egress',
      label: 'Egress control',
      description:
        'Govern which hosts plugins may reach. Turn on the allow-list to deny egress by default, then permit exact origins globally or per plugin. The app itself never makes network requests.',
      icon: Globe,
      group: 'governance',
      component: EgressPanel,
    },
  ],
  sandboxDocUrlFor(pluginId: string, grantedHosts: readonly string[]): string {
    // The granted hosts become the sandbox document's per-plugin `connect-src`
    // (the Rust handler builds the CSP header from them); no hosts ⇒ deny all.
    const hosts = grantedHosts.length > 0 ? encodeURIComponent(grantedHosts.join(',')) : '';
    return `nexine-sandbox://plugin/${encodeURIComponent(pluginId)}${hosts ? `?hosts=${hosts}` : ''}`;
  },
};
