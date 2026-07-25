import { beforeAll, describe, expect, it } from 'vitest';

import { generateKeyPair, keyIdFromPublicKey, type KeyPairMaterial } from './crypto';
import type { PluginPackage } from './format';
import { signPackage } from './sign';
import { createTrustStore } from './trust-store';
import { verifyPackage } from './verify';

const MANIFEST = {
  manifestVersion: 1,
  id: 'dev.acme.csv',
  name: 'CSV Tools',
  version: '1.2.0',
  description: 'Convert and inspect CSV.',
  category: 'data',
  author: 'ACME',
  entry: 'plugin.js',
} as const;

const CODE = 'nexine.definePlugin({ setup() { return { mount() {} }; } });';

let signer: KeyPairMaterial;
let attacker: KeyPairMaterial;

async function makePackage(): Promise<PluginPackage> {
  const result = await signPackage({
    manifest: MANIFEST,
    code: CODE,
    publicKey: signer.publicKey,
    privateKey: signer.privateKey,
    signedAt: 1_700_000_000_000,
  });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

beforeAll(async () => {
  signer = await generateKeyPair();
  attacker = await generateKeyPair();
});

describe('signPackage', () => {
  it('refuses to sign an invalid manifest', async () => {
    const result = await signPackage({
      manifest: { ...MANIFEST, id: 'Bad ID With Spaces' },
      code: CODE,
      publicKey: signer.publicKey,
      privateKey: signer.privateKey,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/invalid manifest/i);
  });

  it('produces a package whose keyId derives from the public key', async () => {
    const pkg = await makePackage();
    expect(pkg.signature.keyId).toBe(await keyIdFromPublicKey(signer.publicKey));
  });
});

describe('verifyPackage — validity', () => {
  it('accepts a freshly signed package', async () => {
    const pkg = await makePackage();
    const result = await verifyPackage(pkg);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.manifest.id).toBe('dev.acme.csv');
      expect(result.value.code).toBe(CODE);
      expect(result.value.signer.keyId).toBe(pkg.signature.keyId);
      expect(result.value.signedAt).toBe(1_700_000_000_000);
    }
  });

  it('rejects a malformed document', async () => {
    for (const bad of [null, 42, {}, { format: 1, code: 'x' }]) {
      const result = await verifyPackage(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.reason).toBe('malformed');
    }
  });
});

describe('verifyPackage — tamper detection', () => {
  it('rejects tampered code', async () => {
    const pkg = await makePackage();
    const tampered: PluginPackage = { ...pkg, code: CODE + '\nfetch("https://evil.example");' };
    const result = await verifyPackage(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.reason).toBe('bad-signature');
  });

  it('rejects a tampered manifest (e.g. escalated permissions)', async () => {
    const pkg = await makePackage();
    const tampered: PluginPackage = {
      ...pkg,
      manifest: {
        ...MANIFEST,
        permissions: [{ id: 'network', hosts: ['https://evil.example'] }],
        dataFlows: [{ destination: 'https://evil.example', description: 'exfil' }],
      },
    };
    const result = await verifyPackage(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.reason).toBe('bad-signature');
  });

  it('rejects a substituted public key with a matching keyId (bad signature)', async () => {
    const pkg = await makePackage();
    // Attacker swaps in their own key and recomputes the keyId to stay consistent,
    // but cannot produce a valid signature without the original private key.
    const forgedKeyId = await keyIdFromPublicKey(attacker.publicKey);
    const forged: PluginPackage = {
      ...pkg,
      signature: { ...pkg.signature, publicKey: attacker.publicKey, keyId: forgedKeyId },
    };
    const result = await verifyPackage(forged);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.reason).toBe('bad-signature');
  });

  it('rejects a keyId that does not derive from the public key', async () => {
    const pkg = await makePackage();
    const forged: PluginPackage = {
      ...pkg,
      signature: { ...pkg.signature, keyId: 'not-the-real-key-id' },
    };
    const result = await verifyPackage(forged);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.reason).toBe('keyid-mismatch');
  });
});

describe('verifyPackage — trust', () => {
  it('is untrusted with an empty/default trust store but still valid', async () => {
    const pkg = await makePackage();
    const result = await verifyPackage(pkg);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.trusted).toBe(false);
  });

  it('is trusted when the signer key is pinned, and surfaces the label', async () => {
    const pkg = await makePackage();
    const store = createTrustStore([{ publicKey: signer.publicKey, label: 'ACME Security' }]);
    const result = await verifyPackage(pkg, { trustStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.trusted).toBe(true);
      expect(result.value.signer.label).toBe('ACME Security');
    }
  });

  it('does not trust a different pinned key', async () => {
    const pkg = await makePackage();
    const store = createTrustStore([{ publicKey: attacker.publicKey, label: 'Someone Else' }]);
    const result = await verifyPackage(pkg, { trustStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.trusted).toBe(false);
  });
});
