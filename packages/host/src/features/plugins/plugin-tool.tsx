import type { ToolModule } from '@nexine/ui';

import { PluginRunView } from './PluginRunView';
import type { PluginToolSource } from './plugin-source';

/**
 * Adapts a plugin into the same `ToolModule` shape first-party tools use, so a
 * plugin appears in the sidebar, command palette and router exactly like a native
 * tool — the shell cannot tell the difference. The only difference is the view:
 * a plugin renders inside a governed sandbox (`PluginRunView`) instead of directly.
 */
export function toPluginToolModule(source: PluginToolSource): ToolModule {
  const { manifest } = source;
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    category: manifest.category,
    keywords: manifest.keywords ?? [],
    ...(manifest.icon ? { icon: manifest.icon } : {}),
    ...(manifest.sensitive ? { sensitive: manifest.sensitive } : {}),
    view: () => <PluginRunView source={source} />,
  };
}
