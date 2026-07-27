import type { Permission, PluginManifest } from '@nexine/sdk';

import { attachRpcHost, type HostServices, type RpcHostHandle } from './rpc-host';

/**
 * Creates the sandboxed iframe a plugin runs in and wires the private RPC channel
 * to it. This is where every earlier layer converges:
 *
 *  - the iframe is `sandbox="allow-scripts"` with **no** `allow-same-origin`, so it
 *    runs at an opaque origin — it cannot touch the host's DOM, cookies or storage;
 *  - it is pointed at a real, same-origin `sandbox.html` (NOT `srcdoc`/`blob:`): a
 *    real-scheme document does not inherit the app's strict `script-src 'self'`, so
 *    the sandbox document's OWN CSP governs it and can authorize the guest. That
 *    document ships `connect-src 'none'`, so the plugin gets no network egress;
 *  - once loaded, the host opens a private `MessageChannel` and, over it, hands the
 *    guest the manifest, the granted permissions, and the plugin source (which the
 *    guest runs as an in-memory `blob:` script). Capabilities are brokered by
 *    `attachRpcHost`.
 */

export interface SandboxOptions {
  readonly manifest: PluginManifest;
  readonly granted: readonly Permission[];
  /** The plugin's self-contained classic-script source. */
  readonly pluginSource: string;
  readonly services: HostServices;
  /** URL of the app's static sandbox document (e.g. `${BASE_URL}sandbox.html`). */
  readonly sandboxDocUrl: string;
  readonly onFatal?: (message: string) => void;
}

export interface PluginSandbox {
  /** The iframe element; the caller appends it wherever the plugin should render. */
  readonly iframe: HTMLIFrameElement;
  dispose(): void;
}

export function createPluginSandbox(options: SandboxOptions): PluginSandbox {
  const { manifest, granted, pluginSource, services, sandboxDocUrl, onFatal } = options;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('title', `${manifest.name} (sandboxed plugin)`);
  iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;background:transparent';

  let rpc: RpcHostHandle | null = null;
  let disposed = false;

  iframe.addEventListener('load', () => {
    if (disposed || !iframe.contentWindow) return;
    const channel = new MessageChannel();
    rpc = attachRpcHost({
      port: channel.port1,
      manifest,
      granted,
      pluginSource,
      services,
      ...(onFatal ? { onFatal } : {}),
    });
    // Opaque origin ⇒ we must target '*'; the channel itself is the private link.
    // The guest accepts this port exactly once, from window.parent only, and all
    // subsequent communication happens over the transferred MessageChannel
    // (structured-clone payloads only — no functions or DOM nodes cross the
    // boundary; the browser throws DataCloneError on non-cloneable values).
    // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
    iframe.contentWindow.postMessage({ type: 'nx:port' }, '*', [channel.port2]);
  });

  iframe.src = sandboxDocUrl;

  return {
    iframe,
    dispose() {
      disposed = true;
      rpc?.dispose();
      iframe.remove();
    },
  };
}
