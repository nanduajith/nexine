import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyPackage, createTrustStore } from '@nexine/packaging';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { readPublicKeyFile } from './keyfile';

import { run } from './index';

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_DIR = resolve(here, '../../../examples/hello-plugin');

let work: string;
let pkgPath: string;

beforeAll(async () => {
  work = await mkdtemp(resolve(tmpdir(), 'nexine-cli-'));
});

afterAll(async () => {
  // Best-effort cleanup; ignore if the runner already tore the tmpdir down.
});

describe('nexine CLI — build + sign pipeline', () => {
  it('keygen writes a private and public key file', async () => {
    const code = await run(['keygen', '--out', work, '--label', 'Test Publisher']);
    expect(code).toBe(0);
    const files = await readdir(work);
    expect(files).toContain('nexine.key.json');
    expect(files).toContain('nexine.pub.json');
  });

  it('pack bundles the example plugin and signs it', async () => {
    const out = resolve(work, 'hello.nexpkg');
    const code = await run([
      'pack',
      EXAMPLE_DIR,
      '--key',
      resolve(work, 'nexine.key.json'),
      '--out',
      out,
    ]);
    expect(code).toBe(0);
    pkgPath = out;

    const pkg = JSON.parse(await readFile(out, 'utf8'));
    expect(pkg.format).toBe(1);
    expect(pkg.signature.algorithm).toBe('ed25519');
    // esbuild really bundled the entry into a self-contained classic script.
    expect(typeof pkg.code).toBe('string');
    expect(pkg.code).toContain('definePlugin');
    expect(pkg.code).not.toContain('import ');
  });

  it('the produced package verifies, and is untrusted until the key is pinned', async () => {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));

    const untrusted = await verifyPackage(pkg);
    expect(untrusted.ok).toBe(true);
    if (untrusted.ok) {
      expect(untrusted.value.manifest.id).toBe('dev.nexine.hello');
      expect(untrusted.value.trusted).toBe(false);
    }

    const pub = await readPublicKeyFile(resolve(work, 'nexine.pub.json'));
    const store = createTrustStore([{ publicKey: pub.publicKey, label: pub.label ?? 'Test' }]);
    const trusted = await verifyPackage(pkg, { trustStore: store });
    expect(trusted.ok).toBe(true);
    if (trusted.ok) expect(trusted.value.trusted).toBe(true);
  });

  it('verify command exits 0 for a valid package and 1 for a tampered one', async () => {
    expect(await run(['verify', pkgPath])).toBe(0);

    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    pkg.code += '\nfetch("https://evil.example");';
    const tamperedPath = resolve(work, 'tampered.nexpkg');
    await writeFile(tamperedPath, JSON.stringify(pkg), 'utf8');
    expect(await run(['verify', tamperedPath])).toBe(1);
  });
});
