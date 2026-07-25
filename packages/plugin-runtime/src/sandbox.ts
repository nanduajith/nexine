import type { Permission, PluginManifest } from '@nexine/sdk';
import { nexineGuestBootstrap } from '@nexine/sdk/guest';

import { buildPluginCsp } from './plugin-csp';
import { attachRpcHost, type HostServices, type RpcHostHandle } from './rpc-host';

/**
 * Creates the sandboxed iframe a plugin runs in and wires the private RPC channel
 * to it. This is where every earlier layer converges:
 *
 *  - the iframe is `sandbox="allow-scripts"` with **no** `allow-same-origin`, so it
 *    runs at an opaque origin — it cannot touch the host's DOM, cookies or storage;
 *  - its document carries the per-plugin CSP from `buildPluginCsp`, so network is
 *    denied-by-default and permitted only to granted hosts — enforced by the browser;
 *  - the guest driver is the host-trusted `nexineGuestBootstrap`, inlined under a
 *    fresh nonce (the plugin's own untrusted code loads as a blob module inside);
 *  - capabilities flow over a `MessageChannel`, brokered by `attachRpcHost`.
 */

export interface SandboxOptions {
  readonly manifest: PluginManifest;
  readonly granted: readonly Permission[];
  /** The plugin's self-contained ES module source (default-exports its definition). */
  readonly pluginSource: string;
  readonly services: HostServices;
  readonly onFatal?: (message: string) => void;
}

export interface PluginSandbox {
  /** The iframe element; the caller appends it wherever the plugin should render. */
  readonly iframe: HTMLIFrameElement;
  dispose(): void;
}

const ROOT_ID = 'nx-plugin-root';

function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Serialize the bootstrap config so it is safe to inline inside an HTML `<script>`:
 * `<` is escaped to prevent a `</script>` / `<!--` breakout. The config is trusted
 * (host-built), but escaping keeps the serializer uniformly safe.
 */
function serializeConfig(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Neutralize any `</script` / `<!--` sequence in the *untrusted* plugin source so
 * it cannot break out of its `<script>` tag. The plugin still executes — inside
 * the sandbox — but only as script content, never as markup.
 */
function escapeScriptBody(source: string): string {
  return source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

function buildSrcdoc(csp: string, nonce: string, configJson: string, pluginSource: string): string {
  // Both scripts are classic (not module) so they execute in document order:
  // the bootstrap installs `nexine.definePlugin`, then the plugin registers.
  const invoke = `(${nexineGuestBootstrap.toString()})(${configJson});`;
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
    '</head>',
    '<body style="margin:0;background:transparent;color-scheme:dark">',
    `<div id="${ROOT_ID}"></div>`,
    `<script nonce="${nonce}">${invoke}</script>`,
    `<script nonce="${nonce}">${escapeScriptBody(pluginSource)}</script>`,
    '</body>',
    '</html>',
  ].join('');
}

export function createPluginSandbox(options: SandboxOptions): PluginSandbox {
  const { manifest, granted, pluginSource, services, onFatal } = options;

  const nonce = makeNonce();
  const csp = buildPluginCsp({ granted, nonce });
  const configJson = serializeConfig({ manifest, rootId: ROOT_ID });

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
      services,
      ...(onFatal ? { onFatal } : {}),
    });
    // Opaque origin ⇒ we must target '*'; the channel itself is the private link.
    iframe.contentWindow.postMessage({ type: 'nx:port' }, '*', [channel.port2]);
  });

  iframe.srcdoc = buildSrcdoc(csp, nonce, configJson, pluginSource);

  return {
    iframe,
    dispose() {
      disposed = true;
      rpc?.dispose();
      iframe.remove();
    },
  };
}
