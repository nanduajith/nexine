import type { PluginManifest } from '../manifest';
import type { Permission } from '../permissions';

import type { ClipboardApi, HostBridge, PluginContext, PluginDefinition, StorageApi } from './api';

/**
 * The guest driver that runs *inside* a plugin's sandboxed, opaque-origin iframe.
 *
 * It cannot be imported there (an opaque origin can't load the host's modules),
 * so the host serializes this exact function with `Function.prototype.toString()`
 * and inlines it into the iframe under a CSP nonce. That makes this the single
 * source of truth for the guest side of the protocol — there is no second copy.
 *
 * The plugin's own code is delivered as a *sibling* nonce-authorized `<script>`
 * that registers its definition by calling the `nexine.definePlugin()` global
 * this bootstrap installs. This avoids any dynamic `import()` (which a bundler
 * would rewrite, and which the strict per-plugin CSP would otherwise force us to
 * enable `unsafe-eval` for).
 *
 * CONSTRAINT: the body must reference only its parameter, browser globals and
 * inline literals — never a module-scope binding — or the stringified copy would
 * capture nothing and break. Type-only imports above are erased at compile time,
 * so they are safe.
 */
export interface GuestBootstrapConfig {
  /** The host-validated manifest (trusted; already fixed the iframe's CSP). */
  readonly manifest: PluginManifest;
  /** Id of the element the plugin mounts into. */
  readonly rootId: string;
}

export function nexineGuestBootstrap(config: GuestBootstrapConfig): void {
  const PROTOCOL = 1;
  const { manifest, rootId } = config;

  let channel: MessagePort | null = null;
  let nextId = 1;
  let registered: PluginDefinition | null = null;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  // The registration API the plugin's sibling script calls.
  (window as unknown as { nexine: { definePlugin: (def: PluginDefinition) => void } }).nexine = {
    definePlugin: (def) => {
      registered = def;
    },
  };

  function fatal(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    channel?.postMessage({ type: 'nx:fatal', message });
  }

  function request(method: string, params: Record<string, unknown>): Promise<unknown> {
    const port = channel;
    if (!port) return Promise.reject(new Error('no host channel'));
    const id = nextId++;
    return new Promise<unknown>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      port.postMessage({ type: 'nx:request', id, request: { method, ...params } });
    });
  }

  function buildContext(granted: readonly Permission[]): PluginContext {
    const has = (id: string): boolean => granted.some((p) => p.id === id);
    const denied = (cap: string): Promise<never> =>
      Promise.reject(new Error(`Permission denied: this plugin was not granted '${cap}'.`));

    const storage: StorageApi = {
      get: (key) =>
        (has('storage') ? request('storage.get', { key }) : denied('storage')) as Promise<
          string | null
        >,
      set: (key, value) =>
        (has('storage')
          ? request('storage.set', { key, value })
          : denied('storage')) as Promise<void>,
      remove: (key) =>
        (has('storage') ? request('storage.remove', { key }) : denied('storage')) as Promise<void>,
      keys: () =>
        (has('storage') ? request('storage.keys', {}) : denied('storage')) as Promise<string[]>,
    };
    const clipboard: ClipboardApi = {
      readText: () =>
        (has('clipboard')
          ? request('clipboard.readText', {})
          : denied('clipboard')) as Promise<string>,
      writeText: (text) =>
        (has('clipboard')
          ? request('clipboard.writeText', { text })
          : denied('clipboard')) as Promise<void>,
    };
    const host: HostBridge = { storage, clipboard };
    return { manifest, permissions: granted, host };
  }

  async function boot(granted: readonly Permission[]): Promise<void> {
    if (!registered || typeof registered.setup !== 'function') {
      throw new Error('plugin did not register a definition via nexine.definePlugin()');
    }
    const instance = await registered.setup(buildContext(granted));
    const root = document.getElementById(rootId);
    if (!root) throw new Error('plugin root element missing');
    await instance.mount(root);
  }

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string } | null;
    if (!data || data.type !== 'nx:port' || !event.ports[0]) return;
    const port = event.ports[0];
    channel = port;
    port.onmessage = (ev: MessageEvent) => {
      const message = ev.data as
        | { type: 'nx:init'; grantedPermissions: Permission[] }
        | {
            type: 'nx:response';
            id: number;
            result:
              | { ok: true; value: unknown }
              | { ok: false; error: { code: string; message: string } };
          };
      if (message.type === 'nx:init') {
        void boot(message.grantedPermissions).catch(fatal);
      } else if (message.type === 'nx:response') {
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.result.ok) entry.resolve(message.result.value);
        else
          entry.reject(new Error(`${message.result.error.code}: ${message.result.error.message}`));
      }
    };
    port.postMessage({ type: 'nx:ready', protocol: PROTOCOL });
  });
}
