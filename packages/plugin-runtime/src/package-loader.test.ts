import {
  generateKeyPair,
  signPackage,
  createTrustStore,
  type KeyPairMaterial,
} from '@nexine/packaging';
import { beforeAll, describe, expect, it } from 'vitest';

import { inspectPackage, loadPackage } from './package-loader';

const MANIFEST = {
  manifestVersion: 1,
  id: 'dev.acme.csv',
  name: 'CSV Tools',
  version: '1.0.0',
  description: 'Convert and inspect CSV.',
  category: 'data',
  entry: 'plugin.js',
  permissions: [{ id: 'storage' }],
} as const;

const CODE = 'nexine.definePlugin({ setup() { return { mount() {} }; } });';

let signer: KeyPairMaterial;

async function makePackage() {
  const result = await signPackage({
    manifest: MANIFEST,
    code: CODE,
    publicKey: signer.publicKey,
    privateKey: signer.privateKey,
  });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

beforeAll(async () => {
  signer = await generateKeyPair();
});

describe('inspectPackage', () => {
  it('verifies a valid package and reports the signer as untrusted by default', async () => {
    const result = await inspectPackage({ package: await makePackage() });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.id).toBe('dev.acme.csv');
      expect(result.code).toBe(CODE);
      expect(result.signer.trusted).toBe(false);
      expect(result.signer.keyId).toBe(signer.keyId);
      expect(result.resolution.granted.map((p) => p.id)).toEqual(['storage']);
    }
  });

  it('reports the signer as trusted when pinned, with the label', async () => {
    const store = createTrustStore([{ publicKey: signer.publicKey, label: 'ACME' }]);
    const result = await inspectPackage({ package: await makePackage(), trustStore: store });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.signer.trusted).toBe(true);
      expect(result.signer.label).toBe('ACME');
    }
  });

  it('rejects a tampered package at the signature stage', async () => {
    const pkg = { ...(await makePackage()), code: `${CODE}\nfetch('https://evil.example');` };
    const result = await inspectPackage({ package: pkg });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe('signature');
      expect(result.reason).toBe('bad-signature');
    }
  });

  it('rejects a malformed document at the signature stage', async () => {
    const result = await inspectPackage({ package: { not: 'a package' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe('signature');
      expect(result.reason).toBe('malformed');
    }
  });

  it('stops a blocked plugin at the policy stage but still surfaces the verified signer', async () => {
    const result = await inspectPackage({
      package: await makePackage(),
      policy: { mode: 'allow', blockedPlugins: ['dev.acme.csv'] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe('policy');
      expect(result.signer?.keyId).toBe(signer.keyId);
    }
  });
});

describe('loadPackage', () => {
  it('refuses to build a sandbox for a tampered package', async () => {
    const pkg = { ...(await makePackage()), code: `${CODE}// tampered` };
    const result = await loadPackage({ package: pkg, sandboxDocUrl: '/sandbox.html' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe('signature');
      expect(result.reason).toBe('bad-signature');
    }
  });

  it("fails if policy blocks the plugin during loadPlugin", async () => {
    let reads = 0;
    const policy = {
      get mode() { return "allow"; },
      get blockedPlugins() {
        reads++;
        return reads > 1 ? ["dev.acme.csv"] : [];
      }
    } as any;
    
    const pkg = await makePackage();
    // mock document so it does not fail on sandbox creation in loadPlugin
    const iframeMock = { setAttribute: () => {}, addEventListener: () => {}, remove: () => {}, style: { cssText: "" }, src: "" };
    (globalThis as any).document = { createElement: () => iframeMock };

    const result = await loadPackage({ package: pkg, sandboxDocUrl: "/sandbox.html", policy });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe("policy");
    }
    delete (globalThis as any).document;
  });

  it("successfully loads a package", async () => {
    const pkg = await makePackage();
    const iframeMock = { setAttribute: () => {}, addEventListener: () => {}, remove: () => {}, style: { cssText: "" }, src: "" };
    (globalThis as any).document = { createElement: () => iframeMock };

    const result = await loadPackage({ package: pkg, sandboxDocUrl: "/sandbox.html", onFatal: () => {}, storageBackend: {} as any });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.signer.trusted).toBe(false);
      expect(result.sandbox).toBeDefined();
    }
    delete (globalThis as any).document;
  });
});
