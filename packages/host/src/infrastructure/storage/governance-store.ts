/**
 * Local plugin governance: the active policy plus the user's per-plugin consent
 * decisions. This is the free, DIY tier of Nexine's governance model — everything
 * is on-device (localStorage), no account, no egress. An enterprise build layers
 * a managed, unbypassable policy on top of the same engine (Phase 3).
 *
 * Consent is recorded per plugin *and version*: a version bump invalidates prior
 * consent, so a plugin that changes its permissions must be re-approved.
 */

import {
  createTrustStore,
  type PluginPackage,
  type TrustStore,
  type TrustedPublisher,
} from '@nexine/packaging';
import type { PluginPolicy } from '@nexine/plugin-runtime';
import { isNetworkPermission, type Permission } from '@nexine/sdk';

import { auditStore } from './audit-store';

export type ConsentDecision = 'granted' | 'denied';

/** A side-loaded, signed package the user has installed, kept for reloads. */
export interface InstalledPackage {
  readonly pluginId: string;
  readonly package: PluginPackage;
  /** Epoch milliseconds. */
  readonly installedAt: number;
}

/** The host's trust settings for signed packages (the DIY tier of publisher trust). */
export interface TrustSettings {
  /** Publisher public keys the user has pinned. */
  readonly publishers: readonly TrustedPublisher[];
  /** When true, a package from an unpinned key is blocked instead of consent-gated. */
  readonly requireTrusted: boolean;
}

export interface ConsentRecord {
  readonly pluginId: string;
  readonly version: string;
  readonly decision: ConsentDecision;
  /** The permission ids granted at consent time (for display / audit). */
  readonly grantedPermissionIds: readonly string[];
  /** Epoch milliseconds. */
  readonly at: number;
}

/**
 * The shareable slice of governance — the "policy file" an admin can export and
 * distribute (the DIY tier of fleet policy). It carries only device-independent
 * decisions (policy, publisher trust, removed builtins) — never per-device
 * consents or installed packages.
 */
export interface PolicyDocument {
  readonly version: 1;
  readonly policy: PluginPolicy;
  readonly trust: TrustSettings;
  readonly disabledBuiltins: readonly string[];
}

export interface GovernanceState {
  readonly policy: PluginPolicy;
  readonly consents: Readonly<Record<string, ConsentRecord>>;
  readonly trust: TrustSettings;
  readonly installed: Readonly<Record<string, InstalledPackage>>;
  /**
   * Ids of builtins (first-party tools and bundled plugins) the user has removed
   * from their tool list. Builtins ship enabled by default, so this is an opt-out
   * set: an id absent here is shown; present here is hidden. Modelled as removals
   * (not additions) so new builtins in a future release appear automatically.
   */
  readonly disabledBuiltins: readonly string[];
}

const STORAGE_KEY = 'nexine.governance.v1';

const DEFAULT_STATE: GovernanceState = {
  policy: { mode: 'allow' },
  consents: {},
  trust: { publishers: [], requireTrusted: false },
  installed: {},
  disabledBuiltins: [],
};

type Listener = () => void;

function loadState(): GovernanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<GovernanceState>;
    const policy =
      parsed.policy && typeof parsed.policy === 'object' ? parsed.policy : DEFAULT_STATE.policy;
    const consents = parsed.consents && typeof parsed.consents === 'object' ? parsed.consents : {};
    const trust =
      parsed.trust && typeof parsed.trust === 'object' ? parsed.trust : DEFAULT_STATE.trust;
    const installed =
      parsed.installed && typeof parsed.installed === 'object' ? parsed.installed : {};
    const disabledBuiltins = Array.isArray(parsed.disabledBuiltins) ? parsed.disabledBuiltins : [];
    return {
      policy: policy as PluginPolicy,
      consents: consents as Record<string, ConsentRecord>,
      trust: trust as TrustSettings,
      installed: installed as Record<string, InstalledPackage>,
      disabledBuiltins: disabledBuiltins as string[],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

class GovernanceStore {
  private state: GovernanceState = loadState();
  private readonly listeners = new Set<Listener>();

  getSnapshot = (): GovernanceState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getPolicy(): PluginPolicy {
    return this.state.policy;
  }

  /** The consent record for a plugin, only if it matches the given version. */
  getConsent(pluginId: string, version: string): ConsentRecord | undefined {
    const record = this.state.consents[pluginId];
    return record && record.version === version ? record : undefined;
  }

  recordConsent(
    pluginId: string,
    version: string,
    decision: ConsentDecision,
    granted: readonly Permission[],
  ): void {
    const grantedPermissionIds = granted.map((p) => p.id);
    const record: ConsentRecord = {
      pluginId,
      version,
      decision,
      grantedPermissionIds,
      at: Date.now(),
    };
    this.commit({ ...this.state, consents: { ...this.state.consents, [pluginId]: record } });
    auditStore.record(
      decision === 'granted' ? 'consent.grant' : 'consent.deny',
      pluginId,
      grantedPermissionIds.join(', ') || undefined,
    );
    // Egress is notable: record which hosts a plugin was actually granted (the
    // effective connect-src), metadata only — never a payload.
    if (decision === 'granted') {
      const net = granted.find(isNetworkPermission);
      if (net && net.hosts.length > 0) {
        auditStore.record('network.grant', pluginId, net.hosts.join(', '));
      }
    }
  }

  revokeConsent(pluginId: string): void {
    const consents = { ...this.state.consents };
    delete consents[pluginId];
    this.commit({ ...this.state, consents });
    auditStore.record('consent.revoke', pluginId);
  }

  blockPlugin(pluginId: string): void {
    const blocked = new Set(this.state.policy.blockedPlugins ?? []);
    blocked.add(pluginId);
    this.commit({ ...this.state, policy: { ...this.state.policy, blockedPlugins: [...blocked] } });
    auditStore.record('plugin.block', pluginId);
  }

  unblockPlugin(pluginId: string): void {
    const blocked = (this.state.policy.blockedPlugins ?? []).filter((id) => id !== pluginId);
    this.commit({ ...this.state, policy: { ...this.state.policy, blockedPlugins: blocked } });
    auditStore.record('plugin.unblock', pluginId);
  }

  private commitPolicy(policy: PluginPolicy): void {
    this.commit({ ...this.state, policy });
  }

  /** Flip the egress posture: when true, network is denied unless a host is allow-listed. */
  setNetworkExplicitAllow(value: boolean): void {
    this.commitPolicy({ ...this.state.policy, networkRequiresExplicitAllow: value });
    auditStore.record('policy.update', 'network egress', value ? 'require allow-list' : 'open');
  }

  /** Add a host to the global egress allow-list (idempotent). */
  addAllowedHost(host: string): void {
    const hosts = new Set(this.state.policy.allowedHosts ?? []);
    hosts.add(host);
    this.commitPolicy({ ...this.state.policy, allowedHosts: [...hosts] });
    auditStore.record('policy.update', 'allowed host', `+ ${host}`);
  }

  removeAllowedHost(host: string): void {
    const hosts = (this.state.policy.allowedHosts ?? []).filter((h) => h !== host);
    const { allowedHosts: _drop, ...rest } = this.state.policy;
    this.commitPolicy(hosts.length > 0 ? { ...rest, allowedHosts: hosts } : rest);
    auditStore.record('policy.update', 'allowed host', `− ${host}`);
  }

  /** Grant a host to one specific plugin (extends only that plugin's ceiling). */
  addPluginHost(pluginId: string, host: string): void {
    const current = this.state.policy.pluginHosts ?? {};
    const hosts = new Set(current[pluginId] ?? []);
    hosts.add(host);
    const pluginHosts = { ...current, [pluginId]: [...hosts] };
    this.commitPolicy({ ...this.state.policy, pluginHosts });
    auditStore.record('policy.update', pluginId, `+ ${host}`);
  }

  removePluginHost(pluginId: string, host: string): void {
    const current = this.state.policy.pluginHosts ?? {};
    const remaining = (current[pluginId] ?? []).filter((h) => h !== host);
    const next: Record<string, readonly string[]> = { ...current };
    if (remaining.length > 0) next[pluginId] = remaining;
    else delete next[pluginId];
    const { pluginHosts: _drop, ...rest } = this.state.policy;
    this.commitPolicy(Object.keys(next).length > 0 ? { ...rest, pluginHosts: next } : rest);
    auditStore.record('policy.update', pluginId, `− ${host}`);
  }

  /** The current pinned publishers as a `TrustStore`, ready for `verifyPackage`. */
  getTrustStore(): TrustStore {
    return createTrustStore(this.state.trust.publishers);
  }

  /** Pin a publisher's public key (idempotent; refreshes the label). */
  pinPublisher(publicKey: string, label?: string): void {
    const others = this.state.trust.publishers.filter((p) => p.publicKey !== publicKey);
    const entry: TrustedPublisher = label ? { publicKey, label } : { publicKey };
    this.commit({ ...this.state, trust: { ...this.state.trust, publishers: [...others, entry] } });
    auditStore.record('publisher.pin', label ?? `${publicKey.slice(0, 16)}…`);
  }

  unpinPublisher(publicKey: string): void {
    const removed = this.state.trust.publishers.find((p) => p.publicKey === publicKey);
    const publishers = this.state.trust.publishers.filter((p) => p.publicKey !== publicKey);
    this.commit({ ...this.state, trust: { ...this.state.trust, publishers } });
    auditStore.record('publisher.unpin', removed?.label ?? `${publicKey.slice(0, 16)}…`);
  }

  setRequireTrusted(requireTrusted: boolean): void {
    this.commit({ ...this.state, trust: { ...this.state.trust, requireTrusted } });
  }

  installPackage(pluginId: string, pkg: PluginPackage): void {
    const record: InstalledPackage = { pluginId, package: pkg, installedAt: Date.now() };
    this.commit({ ...this.state, installed: { ...this.state.installed, [pluginId]: record } });
    auditStore.record('plugin.install', pluginId, pkg.signature.keyId);
  }

  removePackage(pluginId: string): void {
    const installed = { ...this.state.installed };
    delete installed[pluginId];
    // Removing a package also clears its consent so a re-install must re-consent.
    const consents = { ...this.state.consents };
    delete consents[pluginId];
    this.commit({ ...this.state, installed, consents });
    auditStore.record('plugin.uninstall', pluginId);
  }

  /** Restore a removed builtin to the tool list (idempotent). */
  enableBuiltin(id: string): void {
    if (!this.state.disabledBuiltins.includes(id)) return;
    this.commit({
      ...this.state,
      disabledBuiltins: this.state.disabledBuiltins.filter((x) => x !== id),
    });
    auditStore.record('builtin.restore', id);
  }

  /** Remove a builtin from the tool list, clearing any plugin consent it held. */
  disableBuiltin(id: string): void {
    if (this.state.disabledBuiltins.includes(id)) return;
    const consents = { ...this.state.consents };
    delete consents[id];
    this.commit({
      ...this.state,
      disabledBuiltins: [...this.state.disabledBuiltins, id],
      consents,
    });
    auditStore.record('builtin.remove', id);
  }

  /** Export the shareable policy (no consents / installs) for distribution. */
  exportPolicy(): PolicyDocument {
    return {
      version: 1,
      policy: this.state.policy,
      trust: this.state.trust,
      disabledBuiltins: [...this.state.disabledBuiltins],
    };
  }

  /**
   * Apply an imported policy document, replacing policy/trust/removed-builtins.
   * Per-device consents and installed packages are left untouched. Returns whether
   * the document was structurally valid.
   */
  importPolicy(doc: unknown): boolean {
    if (!doc || typeof doc !== 'object') return false;
    const d = doc as Partial<PolicyDocument>;
    if (!d.policy || typeof d.policy !== 'object' || !d.trust || typeof d.trust !== 'object') {
      return false;
    }
    const disabledBuiltins = Array.isArray(d.disabledBuiltins)
      ? (d.disabledBuiltins as string[])
      : this.state.disabledBuiltins;
    this.commit({
      ...this.state,
      policy: d.policy as PluginPolicy,
      trust: d.trust as TrustSettings,
      disabledBuiltins,
    });
    auditStore.record(
      'policy.import',
      `${(d.trust as TrustSettings).publishers.length} pinned publisher(s)`,
    );
    return true;
  }

  private commit(next: GovernanceState): void {
    this.state = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — keep working in-memory.
    }
    for (const listener of this.listeners) listener();
  }
}

export const governanceStore = new GovernanceStore();
