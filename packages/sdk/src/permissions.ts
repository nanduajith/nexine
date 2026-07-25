/**
 * The permission model is the heart of Nexine's plugin security. A plugin is
 * sandboxed and can do *nothing* privileged unless it declares a permission here
 * AND that permission survives the host's policy resolution (see the runtime's
 * permission engine). This file defines only the vocabulary — the declaration
 * side. Enforcement lives in `@nexine/plugin-runtime`.
 *
 * Design rules:
 * - Deny by default: absence of a permission means the capability is unavailable.
 * - Least privilege: every permission is scoped as narrowly as the capability
 *   allows (network is an explicit host allowlist, not a boolean).
 * - Honest by construction: `network` hosts are the exact origins the browser is
 *   permitted to connect to — they become the plugin iframe's CSP `connect-src`.
 */

/** The set of capabilities a plugin may request. Intentionally small and audited. */
export type PermissionId = 'network' | 'clipboard' | 'storage';

/**
 * Network egress, scoped to an explicit allowlist of origins. This is the only
 * way a plugin can reach the network at all; with no `network` permission the
 * plugin iframe ships `connect-src 'none'` and *physically cannot* connect.
 */
export interface NetworkPermission {
  readonly id: 'network';
  /**
   * Exact origins the plugin may connect to, e.g. `https://api.example.com`.
   * An empty list is a no-op (equivalent to not requesting the permission) and
   * is rejected by manifest validation to avoid meaningless declarations.
   */
  readonly hosts: readonly string[];
}

/** Clipboard access, split so a plugin can ask for read without gaining write. */
export interface ClipboardPermission {
  readonly id: 'clipboard';
  readonly access: 'read' | 'write' | 'readwrite';
}

/**
 * Persistent, per-plugin key/value storage. The host namespaces every plugin's
 * storage so plugins can never read each other's data. `maxBytes` is an author
 * hint; the host enforces its own ceiling regardless.
 */
export interface StoragePermission {
  readonly id: 'storage';
  readonly maxBytes?: number;
}

/** A single declared permission. */
export type Permission = NetworkPermission | ClipboardPermission | StoragePermission;

/** Narrowing helpers — used by validation, the permission engine and consent UI. */
export function isNetworkPermission(p: Permission): p is NetworkPermission {
  return p.id === 'network';
}
export function isClipboardPermission(p: Permission): p is ClipboardPermission {
  return p.id === 'clipboard';
}
export function isStoragePermission(p: Permission): p is StoragePermission {
  return p.id === 'storage';
}
