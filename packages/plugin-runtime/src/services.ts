import type { HostServices } from './rpc-host';

/**
 * Concrete host capability implementations. These run on the trusted host side
 * and are only ever reached through the permission-checked broker in `rpc-host`.
 *
 * Storage is strictly namespaced per plugin so one plugin can never see, list, or
 * overwrite another's data — isolation is enforced by key prefixing on the host,
 * not trusted to the guest.
 */

/** Minimal `Storage`-shaped backend, so the namespaced store is unit-testable. */
export interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

const STORAGE_ROOT = 'nx.plugin';
/** Hard ceiling per value; the host is the final authority regardless of manifest hints. */
const MAX_VALUE_BYTES = 1_000_000;

export function createNamespacedStorage(
  pluginId: string,
  backend: KeyValueBackend,
): HostServices['storage'] {
  const prefix = `${STORAGE_ROOT}.${pluginId}.`;

  return {
    async get(key) {
      return backend.getItem(prefix + key);
    },
    async set(key, value) {
      if (new Blob([value]).size > MAX_VALUE_BYTES) {
        throw new Error(`value exceeds the ${MAX_VALUE_BYTES}-byte per-key limit`);
      }
      backend.setItem(prefix + key, value);
    },
    async remove(key) {
      backend.removeItem(prefix + key);
    },
    async keys() {
      const out: string[] = [];
      for (let i = 0; i < backend.length; i++) {
        const full = backend.key(i);
        if (full && full.startsWith(prefix)) out.push(full.slice(prefix.length));
      }
      return out;
    },
  };
}

/** Clipboard service backed by the async Clipboard API (browser only). */
export function createClipboardService(): HostServices['clipboard'] {
  return {
    async readText() {
      return navigator.clipboard.readText();
    },
    async writeText(text) {
      await navigator.clipboard.writeText(text);
    },
  };
}

/**
 * Assemble the full host service set for a plugin. Storage defaults to the real
 * `localStorage`; callers may inject a backend (tests, or a desktop store).
 */
export function createHostServices(
  pluginId: string,
  options: { storageBackend?: KeyValueBackend } = {},
): HostServices {
  const backend = options.storageBackend ?? globalThis.localStorage;
  return {
    storage: createNamespacedStorage(pluginId, backend),
    clipboard: createClipboardService(),
  };
}
