import { useSyncExternalStore } from 'react';

import { preferencesStore, type Preferences } from '../../infrastructure/storage/preferences-store';

/** Subscribe a component to the local preferences store. */
export function usePreferences(): Preferences {
  return useSyncExternalStore(preferencesStore.subscribe, preferencesStore.getSnapshot);
}
