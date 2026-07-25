/**
 * The local governance audit log — the free/DIY tier's record of *what the host
 * decided*, on-device only. It captures governance metadata (installs, consent
 * decisions, blocks, trust changes) and NEVER any plugin input, output, or
 * payload — the same privacy line the enterprise audit pipeline will hold. It is
 * a capped ring buffer in localStorage, reactive like the other stores.
 */

export type AuditEventType =
  | 'plugin.install'
  | 'plugin.uninstall'
  | 'builtin.remove'
  | 'builtin.restore'
  | 'consent.grant'
  | 'consent.deny'
  | 'consent.revoke'
  | 'plugin.block'
  | 'plugin.unblock'
  | 'publisher.pin'
  | 'publisher.unpin'
  | 'policy.import';

export interface AuditEvent {
  readonly id: string;
  /** Epoch milliseconds. */
  readonly at: number;
  readonly type: AuditEventType;
  /** The plugin id, publisher label, or other subject — never a payload. */
  readonly subject: string;
  /** Optional metadata (e.g. granted permission ids). Never a payload. */
  readonly detail?: string;
}

const STORAGE_KEY = 'nexine.audit.v1';
const MAX_EVENTS = 500;

type Listener = () => void;

function loadEvents(): readonly AuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

class AuditStore {
  private events: readonly AuditEvent[] = loadEvents();
  private readonly listeners = new Set<Listener>();

  getSnapshot = (): readonly AuditEvent[] => this.events;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Append a governance event. Callers must pass metadata only — never payloads. */
  record(type: AuditEventType, subject: string, detail?: string): void {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      at: Date.now(),
      type,
      subject,
      ...(detail ? { detail } : {}),
    };
    // Newest first; drop the oldest beyond the cap.
    this.commit([event, ...this.events].slice(0, MAX_EVENTS));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(next: readonly AuditEvent[]): void {
    this.events = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — keep working in-memory.
    }
    for (const listener of this.listeners) listener();
  }
}

export const auditStore = new AuditStore();
