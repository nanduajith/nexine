import type { PermissionResolution, PackageSigner } from '@nexine/plugin-runtime';
import { Badge } from '@nexine/ui';
import type { ReactNode } from 'react';

import { describePermission } from './permission-copy';

/** Truncate a key id for compact display. */
export function shortKey(keyId: string): string {
  return keyId.length > 14 ? `${keyId.slice(0, 14)}…` : keyId;
}

/** Verified / unverified publisher badge for a signed package. */
export function SignerBadge({ signer }: { signer: PackageSigner }) {
  return signer.trusted ? (
    <Badge tone="success">Verified publisher{signer.label ? ` · ${signer.label}` : ''}</Badge>
  ) : (
    <Badge tone="warning">Unverified publisher</Badge>
  );
}

/** A tonal inline notice block. */
export function Notice({
  tone,
  children,
  action,
}: {
  tone: 'danger' | 'muted' | 'warning';
  children: ReactNode;
  action?: ReactNode;
}) {
  const cls =
    tone === 'danger'
      ? 'border-[var(--nx-danger)]/40 bg-[var(--nx-danger)]/10 text-[var(--nx-danger)]'
      : tone === 'warning'
        ? 'border-[var(--nx-warning)]/40 bg-[var(--nx-warning)]/10 text-[var(--nx-warning)]'
        : 'border-[var(--nx-border)] bg-[var(--nx-surface-2)] text-[var(--nx-fg-muted)]';
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[var(--nx-radius-lg)] border px-4 py-3 text-sm ${cls}`}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

/** The per-permission grant/deny list shown in every consent surface. */
export function PermissionList({ resolution }: { resolution: PermissionResolution }) {
  if (resolution.decisions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--nx-fg)]">
        <Badge tone="success">No permissions</Badge>
        fully sandboxed — no network, storage, or clipboard
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {resolution.decisions.map((decision, i) => {
        const info = describePermission(decision.requested);
        return (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--nx-fg)]">{info.label}</div>
              <div className="text-xs text-[var(--nx-fg-subtle)]">{info.detail}</div>
            </div>
            <Badge tone={decision.granted ? 'success' : 'danger'}>
              {decision.granted ? 'grant' : 'deny'}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
