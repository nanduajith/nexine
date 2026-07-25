/**
 * The set of publisher public keys a host has decided to trust. A signature only
 * proves *who* signed a package and that it is untampered; whether that signer is
 * allowed is a separate, host-owned decision made against this store. In the free
 * DIY tier a user pins keys locally; in the enterprise tier an admin distributes
 * an unbypassable store fleet-wide — both consume the same structure.
 */

export interface TrustedPublisher {
  /** Base64 SPKI public key that is trusted to sign plugins. */
  readonly publicKey: string;
  /** Human-facing label shown in the UI, e.g. "ACME Security Tools". */
  readonly label?: string;
}

export interface TrustStore {
  readonly publishers: readonly TrustedPublisher[];
}

/** An empty store — nothing is trusted. This is the deny-by-default starting point. */
export const EMPTY_TRUST_STORE: TrustStore = { publishers: [] };

export function createTrustStore(publishers: readonly TrustedPublisher[]): TrustStore {
  return { publishers: [...publishers] };
}

/** The trusted publisher matching a public key, or `undefined` if not pinned. */
export function findPublisher(store: TrustStore, publicKey: string): TrustedPublisher | undefined {
  return store.publishers.find((p) => p.publicKey === publicKey);
}
