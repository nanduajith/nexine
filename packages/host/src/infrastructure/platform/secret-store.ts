/**
 * A minimal secret-storage port. Consumers depend on this interface, not on a
 * concrete backend — the web build keeps secrets in memory only (never
 * persisted), while the desktop build is backed by the OS keychain.
 */
export interface SecretStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Web fallback: secrets live only in memory for the session and are never
 * written to disk (a browser has no OS keychain). This upholds the
 * "web persists nothing sensitive" rule from the security model.
 */
class EphemeralSecretStore implements SecretStore {
  private readonly store = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }
}

export const ephemeralSecretStore: SecretStore = new EphemeralSecretStore();
