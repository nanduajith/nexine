import { useSyncExternalStore } from 'react';

import { auditStore, type AuditEvent } from '../../infrastructure/storage/audit-store';

/** Subscribe a component to the local governance audit log. */
export function useAudit(): readonly AuditEvent[] {
  return useSyncExternalStore(auditStore.subscribe, auditStore.getSnapshot);
}
