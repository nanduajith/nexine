import { Badge, Button, cn, Panel } from '@nexine/ui';
import {
  Blocks,
  Download,
  ExternalLink,
  type LucideIcon,
  ScrollText,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { useAudit } from '../../app/hooks/useAudit';
import { useGovernance } from '../../app/hooks/useGovernance';
import { BUILTIN_INFO } from '../../builtins';
import { pluginAdapter } from '../../infrastructure/platform/plugin-adapter';
import type { PluginSettingsSection } from '../../infrastructure/platform/plugin-adapter.types';
import { auditStore, type AuditEventType } from '../../infrastructure/storage/audit-store';
import { governanceStore } from '../../infrastructure/storage/governance-store';

import { Notice } from './ui';

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

/**
 * Builtins — the first-party tools that ship with the app. All are enabled by
 * default; each can be removed from the tool list and added back here. Builtins
 * render in-process (they are trusted app code), not in a sandbox.
 */
function BuiltinsPanel() {
  const governance = useGovernance();
  const removed = new Set(governance.disabledBuiltins);

  return (
    <Panel>
      <ul className="flex flex-col gap-3">
        {BUILTIN_INFO.map((builtin) => {
          const enabled = !removed.has(builtin.id);
          return (
            <li
              key={builtin.id}
              className="flex items-center justify-between gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--nx-fg)]">{builtin.name}</div>
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
  'policy.update': 'Updated policy',
  'network.grant': 'Granted network egress',
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
  'network.grant': 'warning',
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

interface SettingsSection {
  readonly id: string;
  readonly label: string;
  /** One-line heading shown at the top of the content pane. */
  readonly description: string;
  readonly icon: LucideIcon;
  readonly render: () => ReactNode;
}

function adapterSection(section: PluginSettingsSection): SettingsSection {
  const Component = section.component;
  return {
    id: section.id,
    label: section.label,
    description: section.description,
    icon: section.icon,
    render: () => <Component />,
  };
}

/**
 * The Settings sections. Plugin surfaces (side-loading, publisher trust, egress)
 * are contributed by the platform's plugin adapter — present on desktop, absent on
 * the web tier, which ships first-party tools only. Order runs from everyday
 * (Plugins, Builtins) through governance (Trust, Egress, Policy) to the read-only
 * record (Activity).
 */
const pluginSections = pluginAdapter.settingsSections;

const SECTIONS: readonly SettingsSection[] = [
  ...pluginSections.filter((s) => s.group === 'plugins').map(adapterSection),
  {
    id: 'builtins',
    label: 'Builtins',
    description:
      'The first-party tools that ship with Nexine, rendered in-process. Enabled by default — remove any you don’t want in your tool list, and add them back anytime.',
    icon: Blocks,
    render: () => <BuiltinsPanel />,
  },
  ...pluginSections.filter((s) => s.group === 'governance').map(adapterSection),
  {
    id: 'policy',
    label: 'Policy file',
    description:
      'Export your governance policy — mode, blocked plugins, trusted publishers, egress rules, removed builtins — to share across devices, or import one. Consents and installs stay local.',
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
 * The Settings surface: a fixed section rail beside a scrollable content pane. On
 * desktop it side-loads and manages plugins, controls publisher trust and egress,
 * toggles builtins, imports/exports the governance policy, and shows the audit log
 * — but never runs a plugin. On the web tier the plugin surfaces are simply absent.
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
