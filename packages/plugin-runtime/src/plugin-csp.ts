import type { Permission } from '@nexine/sdk';
import { isNetworkPermission } from '@nexine/sdk';

/**
 * Builds the Content-Security-Policy for a *single plugin's* sandboxed iframe.
 * This is the enforcement counterpart to the permission engine: whatever network
 * hosts were granted become the iframe's `connect-src`, and a plugin with no
 * network grant gets `connect-src 'none'` — meaning the browser itself refuses
 * every fetch/XHR/WebSocket/beacon the plugin could attempt. There is no host
 * proxy to subvert; denial is enforced by the engine that runs the code.
 *
 * This deterministic, host-set-per-plugin network denial is the core security
 * differentiator over extension models that share an unrestricted process.
 */

export interface PluginCspOptions {
  readonly granted: readonly Permission[];
  /**
   * A single-use nonce authorizing the host's bootstrap script inside the iframe.
   * Must be a fresh, unguessable value per iframe instance.
   */
  readonly nonce: string;
}

function networkHosts(granted: readonly Permission[]): readonly string[] {
  const hosts = granted.filter(isNetworkPermission).flatMap((p) => p.hosts);
  return [...new Set(hosts)];
}

export function buildPluginCsp(options: PluginCspOptions): string {
  const { granted, nonce } = options;
  const hosts = networkHosts(granted);

  const directives: Record<string, readonly string[]> = {
    // Everything is denied unless a directive below re-enables it narrowly.
    'default-src': ["'none'"],
    // Host bootstrap runs under a nonce; plugin code loads as a blob module.
    'script-src': [`'nonce-${nonce}'`, 'blob:'],
    // Plugin UI may set inline styles (cannot exfiltrate); scripts stay locked down.
    'style-src': ["'unsafe-inline'", 'blob:'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:', 'blob:'],
    // Heavy compute may run in a Worker created from a blob.
    'worker-src': ['blob:'],
    // THE control: only granted hosts are connectable; otherwise nothing at all.
    'connect-src': hosts.length > 0 ? hosts : ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    // A plugin cannot nest further frames.
    'frame-src': ["'none'"],
    'child-src': ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/** True when the CSP grants zero network egress — used by tests and audit. */
export function isNoEgressCsp(csp: string): boolean {
  return /connect-src\s+'none'/.test(csp);
}
