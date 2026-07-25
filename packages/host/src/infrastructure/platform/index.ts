import { createDesktopSecretStore, initDesktopIntegration } from './desktop';
import { isDesktop } from './platform';
import { ephemeralSecretStore, type SecretStore } from './secret-store';

export { isDesktop, initDesktopIntegration };
export type { SecretStore };

/** The secret store appropriate for the current platform. */
export function getSecretStore(): SecretStore {
  return isDesktop() ? createDesktopSecretStore() : ephemeralSecretStore;
}
