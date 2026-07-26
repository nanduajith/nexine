import { createTrustStore } from '@nexine/packaging';
import type { PackageSigner, PermissionResolution } from '@nexine/plugin-runtime';
import { inspectPackage, loadPackage } from '@nexine/plugin-runtime';
import { Badge, Button, Panel } from '@nexine/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useGovernance } from '../../app/hooks/useGovernance';
import { usePreferences } from '../../app/hooks/usePreferences';
import {
  governanceStore,
  type GovernanceState,
} from '../../infrastructure/storage/governance-store';

import type { PluginToolSource } from './plugin-source';
import { Notice, PermissionList, shortKey, SignerBadge } from './ui';

/**
 * URL of the static plugin sandbox document. Every plugin iframe points here (a
 * real same-origin document, not srcdoc/blob) so it is governed by its own CSP and
 * does not inherit the app's strict `script-src 'self'`. Resolving against
 * `document.baseURI` keeps it correct under any deploy base (root, `/nexine/app/`, …).
 */
const SANDBOX_DOC_URL = new URL('sandbox.html', document.baseURI).href;

/** Normalised inspection outcome for a signed package. */
type Inspection =
  | { readonly status: 'loading' }
  | { readonly status: 'invalid'; readonly message: string }
  | { readonly status: 'signature'; readonly message: string; readonly reason?: string }
  | { readonly status: 'blocked'; readonly message: string; readonly signer?: PackageSigner }
  | {
      readonly status: 'ok';
      readonly resolution: PermissionResolution;
      readonly signer?: PackageSigner;
    };

function goToSettings() {
  window.location.hash = '#/settings';
}

/** The isolated iframe surface — mounted only after the plugin is allowed to run. */
function SandboxMount({
  source,
  governance,
}: {
  source: PluginToolSource;
  governance: GovernanceState;
}) {
  const { theme } = usePreferences();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const themeRef = useRef<string>(theme);
  themeRef.current = theme;
  const [fatal, setFatal] = useState<string | null>(null);
  const trustStore = useMemo(
    () => createTrustStore(governance.trust.publishers),
    [governance.trust.publishers],
  );

  useEffect(() => {
    setFatal(null);

    // The plugin runs at an opaque origin, so it can't read the host theme; it
    // asks for it once ready, and we push updates. One-way, no capability.
    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const data = event.data as { type?: string; height?: number } | null;
      if (data?.type === 'nx:theme-request') {
        iframe.contentWindow?.postMessage({ type: 'nx:theme', theme: themeRef.current }, '*');
      } else if (data?.type === 'nx:height' && typeof data.height === 'number') {
        iframe.style.height = `${Math.max(data.height, 120)}px`;
      }
    };
    window.addEventListener('message', onMessage);

    const mount = (iframe: HTMLIFrameElement) => {
      iframeRef.current = iframe;
      containerRef.current?.appendChild(iframe);
    };

    // Signed package: re-verify on mount and re-enforce the trust requirement.
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void loadPackage({
      package: source.record.package,
      trustStore,
      sandboxDocUrl: SANDBOX_DOC_URL,
      policy: governance.policy,
      onFatal: setFatal,
    }).then((result) => {
      if (disposed) return;
      if (!result.ok) {
        setFatal(`${result.stage}: ${result.error}`);
        return;
      }
      if (governance.trust.requireTrusted && !result.signer.trusted) {
        result.sandbox.dispose();
        setFatal('policy requires a trusted publisher — pin this signer in Settings to run it');
        return;
      }
      mount(result.sandbox.iframe);
      cleanup = () => result.sandbox.dispose();
    });

    return () => {
      disposed = true;
      window.removeEventListener('message', onMessage);
      iframeRef.current = null;
      cleanup?.();
    };
  }, [source, governance.policy, governance.trust.requireTrusted, trustStore]);

  // Push theme changes to the running plugin without recreating the sandbox.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'nx:theme', theme }, '*');
  }, [theme]);

  return (
    <>
      {fatal && <Notice tone="danger">Plugin error — {fatal}</Notice>}
      {/* The sandboxed iframe self-reports its height; it sits directly on the page
          background so a builtin looks like a native tool, not a card-in-a-card. */}
      <div ref={containerRef} className="min-h-[160px] w-full" />
    </>
  );
}

function ConsentCard({
  source,
  resolution,
  signer,
}: {
  source: PluginToolSource;
  resolution: PermissionResolution;
  signer?: PackageSigner;
}) {
  const { manifest } = source;

  const allow = () =>
    governanceStore.recordConsent(manifest.id, manifest.version, 'granted', resolution.granted);
  const deny = () => governanceStore.recordConsent(manifest.id, manifest.version, 'denied', []);

  return (
    <Panel
      title="Review before running"
      description={`${manifest.name} v${manifest.version}${manifest.author ? ` · ${manifest.author}` : ''}`}
    >
      {signer && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <SignerBadge signer={signer} />
          <span className="font-mono text-xs text-[var(--nx-fg-subtle)]">
            {shortKey(signer.keyId)}
          </span>
        </div>
      )}

      <p className="mb-4 text-sm text-[var(--nx-fg-muted)]">{manifest.description}</p>

      <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--nx-fg-subtle)] uppercase">
        Permissions requested
      </div>
      <div className="mb-4">
        <PermissionList resolution={resolution} />
      </div>

      {manifest.dataFlows && manifest.dataFlows.length > 0 && (
        <>
          <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--nx-fg-subtle)] uppercase">
            Declared data flows
          </div>
          <ul className="mb-4 flex flex-col gap-1 text-sm text-[var(--nx-fg-muted)]">
            {manifest.dataFlows.map((flow, i) => (
              <li key={i}>
                <span className="font-medium text-[var(--nx-fg)]">{flow.destination}</span> —{' '}
                {flow.description}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={allow}>
          Allow &amp; run
        </Button>
        <Button variant="secondary" onClick={deny}>
          Don&apos;t allow
        </Button>
      </div>
    </Panel>
  );
}

/**
 * The full lifecycle for a plugin running as a first-class tool: inspect → consent
 * → run, with the host owning governance (policy, trust, block/allow, consent) and
 * the plugin confined to its sandbox. Nothing runs until the user has seen and
 * approved what it can do. Installing/removing a plugin lives in Settings; this
 * view only runs an already-added one.
 */
export function PluginRunView({ source }: { source: PluginToolSource }) {
  const governance = useGovernance();
  const { manifest } = source;
  const trustStore = useMemo(
    () => createTrustStore(governance.trust.publishers),
    [governance.trust.publishers],
  );

  const [inspection, setInspection] = useState<Inspection>({ status: 'loading' });

  useEffect(() => {
    let stale = false;
    setInspection({ status: 'loading' });
    void inspectPackage({
      package: source.record.package,
      trustStore,
      policy: governance.policy,
    }).then((result) => {
      if (stale) return;
      if (!result.ok && result.stage === 'signature') {
        setInspection({
          status: 'signature',
          message: result.error,
          ...(result.reason ? { reason: result.reason } : {}),
        });
      } else if (!result.ok) {
        setInspection({
          status: 'blocked',
          message: result.error,
          ...(result.signer ? { signer: result.signer } : {}),
        });
      } else {
        setInspection({ status: 'ok', resolution: result.resolution, signer: result.signer });
      }
    });
    return () => {
      stale = true;
    };
  }, [source, governance.policy, trustStore]);

  const record = governance.consents[manifest.id];
  const consent = record && record.version === manifest.version ? record : undefined;
  const isBlocked = (governance.policy.blockedPlugins ?? []).includes(manifest.id);
  const manageButton = (
    <Button variant="secondary" size="sm" onClick={goToSettings}>
      Manage in Settings
    </Button>
  );

  if (inspection.status === 'loading') {
    return <Notice tone="muted">Verifying {manifest.name}…</Notice>;
  }

  // Invalid manifest — a developer/integrity error, not a policy decision.
  if (inspection.status === 'invalid') {
    return (
      <Notice tone="danger">
        This plugin has an invalid manifest and cannot run: {inspection.message}
      </Notice>
    );
  }

  // Signature failed (tampered or not a valid package).
  if (inspection.status === 'signature') {
    return (
      <Notice tone="danger" action={manageButton}>
        <span className="font-medium text-[var(--nx-fg)]">{manifest.name}</span> failed signature
        verification{inspection.reason ? ` (${inspection.reason})` : ''} — {inspection.message}. It
        may have been tampered with; remove and re-install it.
      </Notice>
    );
  }

  // Blocked by policy.
  if (inspection.status === 'blocked') {
    return (
      <Notice
        tone="danger"
        action={
          isBlocked ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => governanceStore.unblockPlugin(manifest.id)}
            >
              Unblock
            </Button>
          ) : (
            manageButton
          )
        }
      >
        <span className="font-medium text-[var(--nx-fg)]">{manifest.name}</span> is blocked by
        policy — {inspection.message}.
      </Notice>
    );
  }

  const { resolution, signer } = inspection;
  const blockedByTrust = governance.trust.requireTrusted && signer !== undefined && !signer.trusted;

  const posture = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="primary">Sandboxed plugin</Badge>
      {signer && <SignerBadge signer={signer} />}
      {resolution.granted.some((p) => p.id === 'network') ? (
        <Badge tone="warning">network granted</Badge>
      ) : (
        <Badge tone="success">No network egress</Badge>
      )}
      {resolution.granted
        .filter((p) => p.id !== 'network')
        .map((p) => (
          <Badge key={p.id} tone="neutral">
            {p.id}
          </Badge>
        ))}
    </div>
  );

  // Policy requires a trusted publisher and this signer is not pinned.
  if (blockedByTrust) {
    return (
      <div className="flex flex-col gap-4">
        {posture}
        <Notice tone="warning" action={manageButton}>
          Your policy requires a <span className="font-medium">trusted publisher</span>. Pin this
          signer, or relax the requirement, in Settings before running{' '}
          <span className="font-medium text-[var(--nx-fg)]">{manifest.name}</span>.
        </Notice>
      </div>
    );
  }

  // Consent was explicitly declined.
  if (consent?.decision === 'denied') {
    return (
      <Notice
        tone="muted"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => governanceStore.revokeConsent(manifest.id)}
          >
            Reconsider
          </Button>
        }
      >
        You declined to run <span className="font-medium text-[var(--nx-fg)]">{manifest.name}</span>
        .
      </Notice>
    );
  }

  // First run (or version changed) — require consent.
  if (!consent) {
    return (
      <div className="flex flex-col gap-4">
        {posture}
        <ConsentCard source={source} resolution={resolution} {...(signer ? { signer } : {})} />
      </div>
    );
  }

  // Approved — run it, with governance controls.
  return (
    <div className="flex flex-col gap-4">
      {posture}
      <SandboxMount source={source} governance={governance} />
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--nx-fg-subtle)]">
        <span>
          Approved {new Date(consent.at).toLocaleDateString()} · granted:{' '}
          {consent.grantedPermissionIds.join(', ') || 'none'}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => governanceStore.revokeConsent(manifest.id)}
          >
            Revoke consent
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => governanceStore.blockPlugin(manifest.id)}
          >
            Block plugin
          </Button>
        </div>
      </div>
    </div>
  );
}
