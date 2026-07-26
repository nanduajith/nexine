import { createTrustStore, type PluginPackage } from '@nexine/packaging';
import { inspectPackage, type InspectPackageResult } from '@nexine/plugin-runtime';
import type { Permission } from '@nexine/sdk';
import { Badge, Button, Panel, Switch, Textarea } from '@nexine/ui';
import { ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useGovernance } from '../../app/hooks/useGovernance';
import {
  governanceStore,
  type InstalledPackage,
} from '../../infrastructure/storage/governance-store';

import { describePermission } from './permission-copy';
import { Notice, PermissionList, shortKey, SignerBadge } from './ui';

/**
 * Desktop-only Settings surfaces for third-party plugins: side-loading a signed
 * package, reviewing it, managing installs, pinning publisher trust, and governing
 * plugin network egress. This module (and its `@nexine/packaging` /
 * `@nexine/plugin-runtime` imports) is never part of the web build — it is reached
 * only through the desktop plugin adapter.
 */

function openTool(id: string) {
  window.location.hash = `#/${id}`;
}

/** Load a package from a file or pasted JSON. */
function LoadPanel({ onLoad }: { onLoad: (pkg: unknown) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (raw: string) => {
    setError(null);
    try {
      onLoad(JSON.parse(raw));
    } catch {
      setError('That is not valid JSON — paste the contents of a .nexpkg file.');
    }
  };

  return (
    <Panel
      title="Side-load a signed plugin"
      description="Load a .nexpkg package. Its Ed25519 signature is verified before anything runs — locally, with no network."
    >
      <div className="flex flex-col gap-3">
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-2 text-sm text-[var(--nx-fg)] hover:bg-[var(--nx-surface-3)]">
          Choose .nexpkg file…
          <input
            type="file"
            accept=".nexpkg,application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void file.text().then((t) => {
                setText(t);
                submit(t);
              });
            }}
          />
        </label>
        <div className="text-xs text-[var(--nx-fg-subtle)]">or paste the package JSON</div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "format": 1, "manifest": { … }, "code": "…", "signature": { … } }'
          className="h-28 font-mono text-xs"
          spellCheck={false}
        />
        {error && <Notice tone="danger">{error}</Notice>}
        <div>
          <Button
            variant="primary"
            onClick={() => submit(text)}
            disabled={text.trim().length === 0}
          >
            Verify package
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/** Preview a loaded package: signature, trust, permissions — then consent + install. */
function PreviewPanel({ pkg, onDone }: { pkg: unknown; onDone: () => void }) {
  const governance = useGovernance();
  const [result, setResult] = useState<InspectPackageResult | null>(null);

  useEffect(() => {
    let stale = false;
    setResult(null);
    void inspectPackage({
      package: pkg,
      trustStore: createTrustStore(governance.trust.publishers),
      policy: governance.policy,
    }).then((r) => {
      if (!stale) setResult(r);
    });
    return () => {
      stale = true;
    };
  }, [pkg, governance.trust.publishers, governance.policy]);

  if (!result) {
    return (
      <Panel title="Verifying…" description="Checking the signature and resolving permissions.">
        <div className="text-sm text-[var(--nx-fg-muted)]">Verifying signature…</div>
      </Panel>
    );
  }

  if (!result.ok && result.stage === 'signature') {
    return (
      <Panel title="Signature check failed" description="This package will not be installed.">
        <Notice tone="danger">
          <span className="font-medium">Rejected ({result.reason}).</span> {result.error}. The
          package is either tampered with or not a valid Nexine package.
        </Notice>
      </Panel>
    );
  }

  const signer = result.signer;
  const pinButton = signer && !signer.trusted && (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => governanceStore.pinPublisher(signer.publicKey)}
    >
      Pin this publisher
    </Button>
  );

  // Signature valid but policy stopped it (e.g. blocked plugin).
  if (!result.ok) {
    return (
      <Panel title="Blocked by policy" description="Signature is valid, but policy denies loading.">
        <div className="flex flex-col gap-3">
          {signer && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <SignerBadge signer={signer} />
                <span className="font-mono text-xs text-[var(--nx-fg-subtle)]">
                  {shortKey(signer.keyId)}
                </span>
              </div>
              {pinButton}
            </div>
          )}
          <Notice tone="danger">{result.error}.</Notice>
        </div>
      </Panel>
    );
  }

  const { manifest, resolution, signer: okSigner } = result;
  const blockedByTrust = governance.trust.requireTrusted && !okSigner.trusted;

  const install = () => {
    governanceStore.recordConsent(manifest.id, manifest.version, 'granted', resolution.granted);
    governanceStore.installPackage(manifest.id, pkg as PluginPackage);
    onDone();
  };

  return (
    <Panel
      title="Review before installing"
      description={`${manifest.name} v${manifest.version}${manifest.author ? ` · ${manifest.author}` : ''}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <SignerBadge signer={okSigner} />
            <span className="font-mono text-xs text-[var(--nx-fg-subtle)]">
              {shortKey(okSigner.keyId)}
            </span>
          </div>
          {pinButton}
        </div>

        <p className="text-sm text-[var(--nx-fg-muted)]">{manifest.description}</p>

        <div>
          <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--nx-fg-subtle)] uppercase">
            Permissions requested
          </div>
          <PermissionList resolution={resolution} />
        </div>

        {blockedByTrust && (
          <Notice tone="warning">
            Your policy requires a <span className="font-medium">trusted publisher</span>. Pin this
            signer to install, or disable the requirement below.
          </Notice>
        )}

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={install} disabled={blockedByTrust}>
            Allow &amp; install
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        <p className="text-xs text-[var(--nx-fg-subtle)]">
          Installing adds it to your tool list. Open it from the sidebar to run it in its sandbox.
        </p>
      </div>
    </Panel>
  );
}

/** Installed signed packages — listed and managed here, never run here. */
function InstalledPanel() {
  const governance = useGovernance();
  const installed = Object.values(governance.installed);

  return (
    <Panel
      title="Installed plugins"
      description="Signed packages on this device. They appear in your sidebar; open one there to run it."
    >
      {installed.length === 0 ? (
        <div className="text-sm text-[var(--nx-fg-subtle)]">
          No plugins installed yet. Side-load a signed package above to add one.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {installed.map((record) => (
            <InstalledRow key={record.pluginId} record={record} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function InstalledRow({ record }: { record: InstalledPackage }) {
  const manifest = record.package.manifest as {
    name?: string;
    version?: string;
    permissions?: readonly Permission[];
  };
  const permissions = manifest.permissions ?? [];

  return (
    <li className="rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--nx-fg)]">
            {manifest.name ?? record.pluginId}{' '}
            <span className="text-xs text-[var(--nx-fg-subtle)]">v{manifest.version ?? '?'}</span>
          </div>
          <div className="font-mono text-xs text-[var(--nx-fg-subtle)]">
            {shortKey(record.package.signature.keyId)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => openTool(record.pluginId)}>
            <ExternalLink size={13} className="mr-1" />
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => governanceStore.removePackage(record.pluginId)}
          >
            Remove
          </Button>
        </div>
      </div>
      {permissions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <Badge key={p.id} tone="neutral">
              {describePermission(p).label}
            </Badge>
          ))}
        </div>
      )}
    </li>
  );
}

/** Plugins section: side-load a signed package, review it, and manage installs. */
export function PluginsSection() {
  const [pending, setPending] = useState<unknown | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <LoadPanel onLoad={setPending} />
      {pending !== null && <PreviewPanel pkg={pending} onDone={() => setPending(null)} />}
      <InstalledPanel />
    </div>
  );
}

/** Manage pinned publisher keys and the require-trusted policy. */
export function TrustPanel() {
  const governance = useGovernance();
  const { publishers, requireTrusted } = governance.trust;

  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--nx-fg)]">
            Require a trusted publisher
            <span className="block text-xs text-[var(--nx-fg-subtle)]">
              Block packages signed by keys you have not pinned.
            </span>
          </span>
          <Switch
            checked={requireTrusted}
            onChange={(v) => governanceStore.setRequireTrusted(v)}
            aria-label="Require a trusted publisher"
          />
        </label>

        {publishers.length === 0 ? (
          <div className="text-sm text-[var(--nx-fg-subtle)]">No publishers pinned yet.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {publishers.map((p) => (
              <li
                key={p.publicKey}
                className="flex items-center justify-between gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm text-[var(--nx-fg)]">{p.label ?? 'Pinned publisher'}</div>
                  <div className="truncate font-mono text-xs text-[var(--nx-fg-subtle)]">
                    {p.publicKey.slice(0, 32)}…
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => governanceStore.unpinPublisher(p.publicKey)}
                >
                  Unpin
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** True for an exact https origin (http only for localhost), no path/query/fragment/wildcard. */
function isValidEgressHost(host: string): boolean {
  try {
    const u = new URL(host);
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    return (
      (u.protocol === 'https:' || (u.protocol === 'http:' && local)) &&
      u.pathname === '/' &&
      u.search === '' &&
      u.hash === '' &&
      !host.includes('*')
    );
  } catch {
    return false;
  }
}

const EGRESS_INPUT_CLASS =
  'min-w-[180px] flex-1 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-1.5 font-mono text-xs text-[var(--nx-fg)] placeholder:text-[var(--nx-fg-subtle)] focus:border-[var(--nx-fg-subtle)] focus:outline-none';

/** A removable chip list of hosts. */
function HostChips({
  hosts,
  onRemove,
}: {
  hosts: readonly string[];
  onRemove: (h: string) => void;
}) {
  if (hosts.length === 0) {
    return <div className="text-xs text-[var(--nx-fg-subtle)]">None yet.</div>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {hosts.map((h) => (
        <li
          key={h}
          className="inline-flex items-center gap-1.5 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-2 py-1 font-mono text-xs text-[var(--nx-fg)]"
        >
          {h}
          <button
            type="button"
            aria-label={`Remove ${h}`}
            onClick={() => onRemove(h)}
            className="text-[var(--nx-fg-subtle)] hover:text-[var(--nx-fg)]"
          >
            <X size={12} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Govern plugin network egress: the allow-list posture, a global host allow-list,
 * and per-plugin host grants. These edit the local `PluginPolicy`; an org can also
 * distribute them via the exported policy file. The granted hosts become each
 * plugin's iframe `connect-src`; the app document itself always stays no-egress.
 */
export function EgressPanel() {
  const { policy } = useGovernance();
  const requireExplicit = policy.networkRequiresExplicitAllow ?? false;
  const allowedHosts = policy.allowedHosts ?? [];
  const pluginHosts = policy.pluginHosts ?? {};

  const [host, setHost] = useState('');
  const [hostError, setHostError] = useState<string | null>(null);
  const [pid, setPid] = useState('');
  const [pluginHost, setPluginHost] = useState('');
  const [pluginError, setPluginError] = useState<string | null>(null);

  const addHost = () => {
    const h = host.trim();
    if (!isValidEgressHost(h)) {
      setHostError('Enter an exact https origin, e.g. https://api.example.com');
      return;
    }
    governanceStore.addAllowedHost(h);
    setHost('');
    setHostError(null);
  };

  const addPluginHost = () => {
    const id = pid.trim();
    const h = pluginHost.trim();
    if (!id) return setPluginError('Enter the plugin id.');
    if (!isValidEgressHost(h)) return setPluginError('Enter an exact https origin.');
    governanceStore.addPluginHost(id, h);
    setPid('');
    setPluginHost('');
    setPluginError(null);
  };

  const pluginEntries = Object.entries(pluginHosts).filter(([, hs]) => hs.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--nx-fg)]">
            Require an allow-list for network egress
            <span className="block text-xs text-[var(--nx-fg-subtle)]">
              When on, a plugin gets no network access unless a host below permits it — even if it
              requests one. Every other capability is unaffected.
            </span>
          </span>
          <Switch
            checked={requireExplicit}
            onChange={(v) => governanceStore.setNetworkExplicitAllow(v)}
            aria-label="Require an allow-list for network egress"
          />
        </label>
      </Panel>

      <Panel
        title="Global allow-list"
        description="Exact https origins every plugin may connect to."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
                setHostError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && addHost()}
              placeholder="https://api.example.com"
              className={EGRESS_INPUT_CLASS}
              aria-label="Host to allow"
            />
            <Button variant="secondary" size="sm" onClick={addHost}>
              <Plus size={13} className="mr-1" />
              Add
            </Button>
          </div>
          {hostError && <Notice tone="danger">{hostError}</Notice>}
          <HostChips hosts={allowedHosts} onRemove={(h) => governanceStore.removeAllowedHost(h)} />
        </div>
      </Panel>

      <Panel
        title="Per-plugin grants"
        description="Extra hosts granted to a single plugin by id — e.g. one tool's internal endpoint that others may not reach."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={pid}
              onChange={(e) => {
                setPid(e.target.value);
                setPluginError(null);
              }}
              placeholder="plugin id (e.g. dev.acme.reporter)"
              className={EGRESS_INPUT_CLASS}
              aria-label="Plugin id"
            />
            <input
              value={pluginHost}
              onChange={(e) => {
                setPluginHost(e.target.value);
                setPluginError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && addPluginHost()}
              placeholder="https://internal.example.com"
              className={EGRESS_INPUT_CLASS}
              aria-label="Host to grant this plugin"
            />
            <Button variant="secondary" size="sm" onClick={addPluginHost}>
              <Plus size={13} className="mr-1" />
              Grant
            </Button>
          </div>
          {pluginError && <Notice tone="danger">{pluginError}</Notice>}
          {pluginEntries.length === 0 ? (
            <div className="text-xs text-[var(--nx-fg-subtle)]">No per-plugin grants.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {pluginEntries.map(([id, hs]) => (
                <li
                  key={id}
                  className="rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-2"
                >
                  <div className="mb-1.5 font-mono text-xs text-[var(--nx-fg)]">{id}</div>
                  <HostChips hosts={hs} onRemove={(h) => governanceStore.removePluginHost(id, h)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
