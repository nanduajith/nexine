// Public surface of the signed-package layer. The build tool (Node) signs; the
// host (browser) verifies against a trust store before side-loading. All bytes are
// produced by the same isomorphic canonicalization + Ed25519 core.

// Package format
export {
  PACKAGE_FORMAT_VERSION,
  SIGNATURE_ALGORITHM,
  isPluginPackage,
  envelopeFor,
} from './format';
export type { PackageSignature, PluginPackage, SigningEnvelope } from './format';

// Canonical serialization
export { canonicalJson, CanonicalizationError } from './canonical';

// Cryptography
export { generateKeyPair, keyIdFromPublicKey, sign, verify } from './crypto';
export type { KeyPairMaterial } from './crypto';

// Signing
export { signPackage, signingBytes } from './sign';
export type { SignPackageInput } from './sign';

// Trust store
export { EMPTY_TRUST_STORE, createTrustStore, findPublisher } from './trust-store';
export type { TrustStore, TrustedPublisher } from './trust-store';

// Verification
export { verifyPackage } from './verify';
export type {
  VerificationError,
  VerificationFailure,
  VerifiedPackage,
  VerifyOptions,
} from './verify';

// Byte/string codecs (occasionally needed by tooling)
export {
  bytesToBase64,
  base64ToBytes,
  bytesToBase64Url,
  utf8ToBytes,
  bytesToUtf8,
} from './encoding';
