import type { PluginManifest } from '../manifest';
import type { Permission } from '../permissions';
import type { GuestToHostMessage, HostToGuestMessage } from '../rpc/protocol';
import { RPC_PROTOCOL_VERSION } from '../rpc/protocol';

import type { ClipboardApi, HostBridge, PluginContext, PluginDefinition, StorageApi } from './api';

/**
 * The guest driver that runs *inside* a plugin's sandboxed, opaque-origin iframe.
 *
 * The iframe is a real, static document (`sandbox.html`) served from the app
 * origin. Because it is fetched over a normal scheme — not `srcdoc`/`blob:`/`data:`
 * — it does NOT inherit the app's strict `script-src 'self'`; it is governed only
 * by its own CSP. That is what lets this bundled guest run (as a `'self'` module)
 * and, in turn, execute the untrusted plugin as a `blob:` script.
 *
 * Flow: the host opens a private `MessageChannel` (`nx:port`). The guest replies
 * `nx:ready`; the host answers `nx:init` with the manifest, the granted
 * permissions, and the plugin's source. The guest then runs that source as a
 * `blob:` `<script>` (which calls `nexine.definePlugin`), builds the capability
 * bridge for exactly what was granted, and mounts the plugin.
 */

/** The element every plugin mounts into; present in `sandbox.html`. */
const ROOT_ID = 'nx-plugin-root';

export function runNexineGuest(): void {
  let channel: MessagePort | null = null;
  let nextId = 1;
  let registered: PluginDefinition | null = null;
  let manifest: PluginManifest | null = null;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  // The registration API the plugin's own (blob) script calls.
  (window as unknown as { nexine: { definePlugin: (def: PluginDefinition) => void } }).nexine = {
    definePlugin: (def) => {
      registered = def;
    },
  };

  function fatal(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const msg: GuestToHostMessage = { type: 'nx:fatal', message };
    channel?.postMessage(msg);
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
    // `manifest` is set from `nx:init` before boot runs.
    return { manifest: manifest as PluginManifest, permissions: granted, host, t: (key) => key };
  }

  /**
   * Execute the plugin's source as a `blob:` classic script. The sandbox document's
   * CSP permits `script-src blob:`, so this runs *inside* the opaque sandbox and
   * only as script — never as markup. It calls `nexine.definePlugin` on load.
   */
  function runPluginSource(source: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const script = document.createElement('script');
      script.addEventListener('load', () => {
        URL.revokeObjectURL(url);
        resolve();
      });
      script.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('plugin source failed to load'));
      });
      script.src = url;
      document.body.appendChild(script);
    });
  }

  async function boot(source: string, granted: readonly Permission[]): Promise<void> {
    await runPluginSource(source);
    if (!registered || typeof registered.setup !== 'function') {
      throw new Error('plugin did not register a definition via nexine.definePlugin()');
    }
    const instance = await registered.setup(buildContext(granted));
    const root = document.getElementById(ROOT_ID);
    if (!root) throw new Error('plugin root element missing');
    await instance.mount(root);
  }

  // Accept the host's MessageChannel port exactly once, from window.parent only.
  // event.origin is deliberately not checked — the guest runs at an opaque origin
  // (sandbox="allow-scripts"), so its origin is the string "null" and the parent's
  // origin may vary (custom protocol, localhost, production). The private
  // MessageChannel is the trusted link, not the origin string.
  // nosemgrep: javascript.browser.security.insufficient-postmessage-origin-validation.insufficient-postmessage-origin-validation
  window.addEventListener('message', function onPort(event: MessageEvent) {
    if (event.source !== window.parent) return;
    const data = event.data as { type?: string } | null;
    if (!data || data.type !== 'nx:port' || !event.ports[0]) return;
    window.removeEventListener('message', onPort);
    const port = event.ports[0];
    channel = port;
    port.onmessage = (ev: MessageEvent<HostToGuestMessage>) => {
      const message = ev.data;
      if (message.type === 'nx:init') {
        manifest = message.manifest;
        void boot(message.pluginSource, message.grantedPermissions).catch(fatal);
      } else if (message.type === 'nx:response') {
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.result.ok) entry.resolve(message.result.value);
        else
          entry.reject(new Error(`${message.result.error.code}: ${message.result.error.message}`));
      }
    };
    const ready: GuestToHostMessage = { type: 'nx:ready', protocol: RPC_PROTOCOL_VERSION };
    port.postMessage(ready);
  });
}
