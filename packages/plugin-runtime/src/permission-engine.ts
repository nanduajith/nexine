import type { PluginManifest, Permission, PermissionId } from '@nexine/sdk';
import { isNetworkPermission } from '@nexine/sdk';

/**
 * The permission engine resolves the permissions a plugin *requested* (in its
 * manifest) against the active *policy* (governance) into the permissions it is
 * actually *granted*. It is a pure function — no I/O, no globals — so the security
 * decision is fully unit-testable and identical on desktop, web and CI.
 *
 * This is where Nexine's governance story becomes real:
 *  - individuals run the permissive default policy (grant what's requested), and
 *  - organizations distribute a stricter policy (ceilings, allow/block, lockdown)
 *    that the host applies here before a single line of plugin code loads.
 *
 * Deny-by-default is structural: a capability is granted only if it was both
 * requested and survives every policy check.
 */

/** Graduated governance posture (the plan's observe → blocklist → lockdown ladder). */
export type PolicyMode = 'allow' | 'blocklist' | 'lockdown';

export interface PluginPolicy {
  /**
   * - `allow`     — plugins load unless explicitly blocked (observe/DIY default).
   * - `blocklist` — same as allow, but the blocklist is the primary control.
   * - `lockdown`  — only explicitly allowed plugins may load; everything else is denied.
   */
  readonly mode: PolicyMode;
  /** Plugin ids that may never load. */
  readonly blockedPlugins?: readonly string[];
  /** Plugin ids permitted to load; the sole allowlist under `lockdown`. */
  readonly allowedPlugins?: readonly string[];
  /** Capability ceiling: these permission ids are denied to every plugin. */
  readonly deniedPermissions?: readonly PermissionId[];
  /**
   * Global network host ceiling. When set, a plugin's requested network hosts are
   * intersected with this list; hosts outside it are dropped. When omitted, the
   * behaviour depends on `networkRequiresExplicitAllow` (below).
   */
  readonly allowedHosts?: readonly string[];
  /**
   * The egress posture.
   * - `false`/omitted (DIY default) — **open**: a plugin's declared hosts are
   *   granted as-is, unless narrowed by `allowedHosts`/`pluginHosts`.
   * - `true` (enterprise) — **default-deny egress**: a `network` permission is
   *   granted only for hosts explicitly allow-listed in `allowedHosts` or
   *   `pluginHosts[id]`. With neither set, all egress is denied.
   *
   * This is the switch that lets an org say "no plugin reaches the network unless
   * I say which hosts" without limiting what plugins can otherwise do. Enforcement
   * is unchanged: the granted hosts become the plugin iframe's `connect-src`, and
   * the app document itself always stays `connect-src 'none'`.
   */
  readonly networkRequiresExplicitAllow?: boolean;
  /**
   * Per-plugin network host grants, keyed by plugin id. These hosts are added to a
   * specific plugin's ceiling — the way an admin grants one plugin egress to an
   * exact endpoint (e.g. an internal JWKS URL) that other plugins may not reach.
   */
  readonly pluginHosts?: Readonly<Record<string, readonly string[]>>;
}

/** The permissive default: an individual developer's machine with no org policy. */
export const DEFAULT_POLICY: PluginPolicy = { mode: 'allow' };

export interface PermissionDecision {
  readonly requested: Permission;
  readonly granted: Permission | null;
  readonly reason: string;
}

export interface PermissionResolution {
  readonly pluginId: string;
  /** Whether the plugin is permitted to load at all under the policy. */
  readonly allowedToLoad: boolean;
  readonly loadReason: string;
  /** The effective permissions, ready to hand to the sandbox. */
  readonly granted: readonly Permission[];
  /** Per-permission audit trail (for the consent UI and audit log). */
  readonly decisions: readonly PermissionDecision[];
}

function resolveLoad(pluginId: string, policy: PluginPolicy): { allowed: boolean; reason: string } {
  const blocked = policy.blockedPlugins?.includes(pluginId) ?? false;
  if (blocked) return { allowed: false, reason: 'plugin is on the block list' };

  if (policy.mode === 'lockdown') {
    const allowed = policy.allowedPlugins?.includes(pluginId) ?? false;
    return allowed
      ? { allowed: true, reason: 'plugin is on the lockdown allow list' }
      : { allowed: false, reason: 'lockdown policy: plugin is not on the allow list' };
  }

  return { allowed: true, reason: 'permitted by policy' };
}

/**
 * The set of network hosts a given plugin is permitted to reach under policy, or
 * `null` for "unbounded" (the plugin's own declared hosts stand). This is the one
 * place the egress posture is decided.
 */
function networkHostCeiling(pluginId: string, policy: PluginPolicy): ReadonlySet<string> | null {
  const perPlugin = policy.pluginHosts?.[pluginId] ?? [];
  if (policy.networkRequiresExplicitAllow) {
    // Default-deny: only explicitly allow-listed hosts pass (empty ⇒ deny all).
    return new Set([...(policy.allowedHosts ?? []), ...perPlugin]);
  }
  // Open posture: unbounded unless a global ceiling is configured, in which case
  // per-plugin grants extend that plugin's ceiling.
  if (policy.allowedHosts === undefined) return null;
  return new Set([...policy.allowedHosts, ...perPlugin]);
}

function resolvePermission(
  permission: Permission,
  policy: PluginPolicy,
  pluginId: string,
): PermissionDecision {
  if (policy.deniedPermissions?.includes(permission.id)) {
    return { requested: permission, granted: null, reason: `'${permission.id}' denied by policy` };
  }

  if (isNetworkPermission(permission)) {
    const ceiling = networkHostCeiling(pluginId, policy);
    if (ceiling === null) {
      return { requested: permission, granted: permission, reason: 'granted' };
    }
    const hosts = permission.hosts.filter((h) => ceiling.has(h));
    if (hosts.length === 0) {
      return {
        requested: permission,
        granted: null,
        reason: policy.networkRequiresExplicitAllow
          ? 'network egress denied: no requested host is on the policy allow-list'
          : 'no requested network host is within the policy host ceiling',
      };
    }
    return {
      requested: permission,
      granted: { id: 'network', hosts },
      reason:
        hosts.length === permission.hosts.length
          ? 'granted'
          : 'granted with hosts narrowed to the policy ceiling',
    };
  }

  return { requested: permission, granted: permission, reason: 'granted' };
}

export function resolvePermissions(
  manifest: PluginManifest,
  policy: PluginPolicy = DEFAULT_POLICY,
): PermissionResolution {
  const load = resolveLoad(manifest.id, policy);

  // If the plugin can't load, no permission is granted — but we still report the
  // per-permission decisions (all denied) so the UI can explain why.
  const requested = manifest.permissions ?? [];
  const decisions: PermissionDecision[] = requested.map((permission) =>
    load.allowed
      ? resolvePermission(permission, policy, manifest.id)
      : { requested: permission, granted: null, reason: 'plugin is not permitted to load' },
  );

  const granted = decisions.map((d) => d.granted).filter((p): p is Permission => p !== null);

  return {
    pluginId: manifest.id,
    allowedToLoad: load.allowed,
    loadReason: load.reason,
    granted,
    decisions,
  };
}
