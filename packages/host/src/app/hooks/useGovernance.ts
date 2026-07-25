import { useSyncExternalStore } from 'react';

import {
  governanceStore,
  type GovernanceState,
} from '../../infrastructure/storage/governance-store';

/** Subscribe a component to the local plugin governance store (policy + consents). */
export function useGovernance(): GovernanceState {
  return useSyncExternalStore(governanceStore.subscribe, governanceStore.getSnapshot);
}
