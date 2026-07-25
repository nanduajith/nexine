import { createTrustStore, type PluginPackage } from '@nexine/packaging';
import { inspectPackage, type InspectPackageResult } from '@nexine/plugin-runtime';
import type { Permission } from '@nexine/sdk';
import { Badge, Button, cn, Panel, Switch, Textarea } from '@nexine/ui';
import {
  Blocks,
  Download,
  ExternalLink,
  type LucideIcon,
  Puzzle,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { useAudit } from '../../app/hooks/useAudit';
import { useGovernance } from '../../app/hooks/useGovernance';
import { auditStore, type AuditEventType } from '../../infrastructure/storage/audit-store';
import {
  governanceStore,
  type InstalledPackage,
} from '../../infrastructure/storage/governance-store';

import { BUILTINS } from './builtins';
import { describePermission } from './permission-copy';
import { Notice, PermissionList, shortKey, SignerBadge } from './ui';

function openTool(id: string) {
  window.location.hash = `#/${id}`;
}

/** Trigger a local file download of `data` as pretty JSON — no network involved. */
function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
    governanceStore.recordConsent(
      manifest.id,
      manifest.version,
      'granted',
      resolution.granted.map((p) => p.id),
    );
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

/**
 * Builtins — the tools and plugins that ship with the app. All are enabled by
 * default; each can be removed from the tool list and added back here. Every
 * builtin runs in the sandbox, exactly like a side-loaded plugin.
 */
function BuiltinsPanel() {
  const governance = useGovernance();
  const removed = new Set(governance.disabledBuiltins);

  return (
    <Panel>
      <ul className="flex flex-col gap-3">
        {BUILTINS.map((builtin) => {
          const enabled = !removed.has(builtin.id);
          return (
            <li
              key={builtin.id}
              className="flex items-center justify-between gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--nx-fg)]">{builtin.name}</span>
                  <Badge tone="primary">sandboxed</Badge>
                </div>
                <div className="text-xs text-[var(--nx-fg-subtle)]">{builtin.description}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {enabled && (
                  <Button variant="secondary" size="sm" onClick={() => openTool(builtin.id)}>
                    <ExternalLink size={13} className="mr-1" />
                    Open
                  </Button>
                )}
                <Button
                  variant={enabled ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() =>
                    enabled
                      ? governanceStore.disableBuiltin(builtin.id)
                      : governanceStore.enableBuiltin(builtin.id)
                  }
                >
                  {enabled ? 'Remove' : 'Add to tools'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Manage pinned publisher keys and the require-trusted policy. */
function TrustPanel() {
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

/** Export the shareable governance policy to a file, or import one back. */
function PolicyPanel() {
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const onImport = (file: File) => {
    setError(null);
    setImported(false);
    void file.text().then((text) => {
      let doc: unknown;
      try {
        doc = JSON.parse(text);
      } catch {
        setError('That is not valid JSON — choose a policy file exported from Nexine.');
        return;
      }
      if (governanceStore.importPolicy(doc)) setImported(true);
      else setError('That JSON is not a Nexine policy document (missing policy/trust).');
    });
  };

  return (
    <Panel>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadJson('nexine-policy.json', governanceStore.exportPolicy())}
          >
            <Download size={13} className="mr-1" />
            Export policy
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--nx-fg)] hover:bg-[var(--nx-surface-3)]">
            <Upload size={13} />
            Import policy
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
        {imported && <Notice tone="muted">Policy imported and applied.</Notice>}
      </div>
    </Panel>
  );
}

const AUDIT_COPY: Record<AuditEventType, string> = {
  'plugin.install': 'Installed package',
  'plugin.uninstall': 'Removed package',
  'builtin.remove': 'Removed builtin',
  'builtin.restore': 'Restored builtin',
  'consent.grant': 'Granted consent',
  'consent.deny': 'Denied consent',
  'consent.revoke': 'Revoked consent',
  'plugin.block': 'Blocked plugin',
  'plugin.unblock': 'Unblocked plugin',
  'publisher.pin': 'Pinned publisher',
  'publisher.unpin': 'Unpinned publisher',
  'policy.import': 'Imported policy',
};

const AUDIT_TONE: Partial<Record<AuditEventType, 'success' | 'danger' | 'warning'>> = {
  'consent.grant': 'success',
  'plugin.install': 'success',
  'builtin.restore': 'success',
  'consent.deny': 'danger',
  'plugin.block': 'danger',
  'plugin.uninstall': 'warning',
  'builtin.remove': 'warning',
  'consent.revoke': 'warning',
};

/** The on-device governance audit log — metadata only, never payloads. */
function ActivityLogPanel() {
  const events = useAudit();

  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={events.length === 0}
          onClick={() => downloadJson('nexine-audit-log.json', events)}
        >
          <Download size={13} className="mr-1" />
          Export log
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={events.length === 0}
          onClick={() => auditStore.clear()}
        >
          Clear
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-[var(--nx-fg-subtle)]">No activity recorded yet.</div>
      ) : (
        <ul className="flex flex-col gap-1">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-[var(--nx-radius)] px-2 py-1.5 text-sm hover:bg-[var(--nx-surface-2)]"
            >
              <Badge tone={AUDIT_TONE[event.type] ?? 'neutral'}>{AUDIT_COPY[event.type]}</Badge>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--nx-fg)]">
                {event.subject}
                {event.detail ? (
                  <span className="text-[var(--nx-fg-subtle)]"> · {event.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-[var(--nx-fg-subtle)]">
                {new Date(event.at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Plugins section: side-load a signed package, review it, and manage installs. */
function PluginsSection() {
  const [pending, setPending] = useState<unknown | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <LoadPanel onLoad={setPending} />
      {pending !== null && <PreviewPanel pkg={pending} onDone={() => setPending(null)} />}
      <InstalledPanel />
    </div>
  );
}

interface SettingsSection {
  readonly id: string;
  readonly label: string;
  /** One-line heading shown at the top of the content pane. */
  readonly description: string;
  readonly icon: LucideIcon;
  readonly render: () => ReactNode;
}

/**
 * The Settings sections. Each is a focused surface reached from the left nav — no
 * single endless scroll. Order runs from everyday (Plugins, Builtins) to
 * governance (Trust, Policy) to the read-only record (Activity).
 */
const SECTIONS: readonly SettingsSection[] = [
  {
    id: 'plugins',
    label: 'Plugins',
    description:
      'Side-load signed plugins and manage what you have installed. Each runs in its own sandbox from the tool list — never here.',
    icon: Puzzle,
    render: () => <PluginsSection />,
  },
  {
    id: 'builtins',
    label: 'Builtins',
    description:
      'The sandboxed tools that ship with Nexine. Enabled by default — remove any you don’t want in your tool list, and add them back anytime.',
    icon: Blocks,
    render: () => <BuiltinsPanel />,
  },
  {
    id: 'trust',
    label: 'Publisher trust',
    description:
      'Pin the public keys you trust to sign plugins. A valid signature alone never implies trust — that decision is yours.',
    icon: ShieldCheck,
    render: () => <TrustPanel />,
  },
  {
    id: 'policy',
    label: 'Policy file',
    description:
      'Export your governance policy — mode, blocked plugins, trusted publishers, removed builtins — to share across devices, or import one. Consents and installs stay local.',
    icon: SlidersHorizontal,
    render: () => <PolicyPanel />,
  },
  {
    id: 'activity',
    label: 'Activity log',
    description:
      'Every governance decision on this device — installs, consent, blocks, trust. Metadata only; plugin inputs and outputs are never recorded.',
    icon: ScrollText,
    render: () => <ActivityLogPanel />,
  },
];

/**
 * The Settings surface: a fixed section rail beside a scrollable content pane.
 * It side-loads and manages plugins, toggles builtins, controls publisher trust,
 * imports/exports the governance policy, and shows the audit log — but never runs
 * a plugin. Running happens from the tool list, in the plugin's own sandbox.
 */
export function SettingsView() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]!.id);
  const section = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]!;

  return (
    <div className="flex h-full min-h-0">
      <nav
        aria-label="Settings sections"
        className="w-56 shrink-0 overflow-y-auto border-r border-[var(--nx-border)] p-3"
      >
        <ul className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.id === section.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[var(--nx-radius)] px-3 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-[var(--nx-surface-2)] font-medium text-[var(--nx-fg)]'
                      : 'text-[var(--nx-fg-muted)] hover:bg-[var(--nx-surface-2)] hover:text-[var(--nx-fg)]',
                  )}
                >
                  <Icon
                    size={16}
                    className={cn('shrink-0', active && 'text-[var(--nx-primary)]')}
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <header className="mb-5">
            <h2 className="text-base font-semibold text-[var(--nx-fg)]">{section.label}</h2>
            <p className="mt-1 text-sm text-[var(--nx-fg-subtle)]">{section.description}</p>
          </header>
          {section.render()}
        </div>
      </div>
    </div>
  );
}
