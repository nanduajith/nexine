import type { PluginManifest } from '@nexine/sdk';
import type { PluginContext, PluginInstance } from '@nexine/sdk/guest';
import type { ToolModule } from '@nexine/ui';

import { BuiltinToolView } from './BuiltinToolView';

/** A first-party tool's setup function — mirrors the plugin `setup`, run in-process. */
export type BuiltinSetup = (ctx: PluginContext) => PluginInstance | Promise<PluginInstance>;

/**
 * Adapt a first-party builtin (manifest + setup) into the shared `ToolModule` the
 * shell renders. Unlike a third-party plugin, the view mounts in-process — no
 * iframe, no sandbox — because builtins are trusted app code.
 */
export function toBuiltinToolModule(manifest: PluginManifest, setup: BuiltinSetup): ToolModule {
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    category: manifest.category,
    keywords: manifest.keywords ?? [],
    ...(manifest.icon ? { icon: manifest.icon } : {}),
    ...(manifest.sensitive ? { sensitive: manifest.sensitive } : {}),
    view: () => <BuiltinToolView manifest={manifest} setup={setup} />,
  };
}
