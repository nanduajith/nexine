import type { PluginManifest } from '@nexine/sdk';
import type { HostBridge, PluginContext, StorageApi } from '@nexine/sdk/guest';

/**
 * The host bridge for first-party tools running **in-process** (web + desktop).
 * First-party tools are trusted app code compiled into the bundle, so there is no
 * iframe, RPC broker or permission enforcement here — capabilities are wired
 * straight to the platform. Third-party plugins are the opposite: desktop-only and
 * always sandboxed (see the plugin adapter).
 */

const SEP = ':';

/**
 * Namespaced localStorage for a tool. Since in-process tools share the host's
 * `window.localStorage`, every key is strictly prefixed and `keys()` is scoped to
 * that prefix, so a tool cannot read or clobber host keys (e.g. governance). This
 * is defence-in-depth against *accidental* collisions — not a security boundary:
 * trusted first-party code could reach `localStorage` directly regardless.
 */
function namespacedStorage(toolId: string): StorageApi {
  if (toolId.includes(SEP) || toolId.includes('/')) {
    throw new Error(`invalid tool id for storage namespace: ${toolId}`);
  }
  const prefix = `nx:tool${SEP}${toolId}${SEP}`;
  const backend = globalThis.localStorage;
  return {
    get: (key) => Promise.resolve(backend.getItem(prefix + key)),
    set: (key, value) => Promise.resolve(backend.setItem(prefix + key, value)),
    remove: (key) => Promise.resolve(backend.removeItem(prefix + key)),
    keys: () => {
      const out: string[] = [];
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i);
        if (k && k.startsWith(prefix)) out.push(k.slice(prefix.length));
      }
      return Promise.resolve(out);
    },
  };
}

const clipboard = {
  readText: () => navigator.clipboard.readText(),
  writeText: (text: string) => navigator.clipboard.writeText(text),
};

/** Build the in-process context handed to a first-party tool's `setup`. */
export function createInProcessContext(manifest: PluginManifest): PluginContext {
  const host: HostBridge = { storage: namespacedStorage(manifest.id), clipboard };
  return { manifest, permissions: manifest.permissions ?? [], host };
}
