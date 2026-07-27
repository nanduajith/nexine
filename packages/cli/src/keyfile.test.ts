
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { readPrivateKeyFile, readPublicKeyFile } from './keyfile.js';

describe('keyfile', () => {
  it('throws on invalid private key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'));
    const path = join(dir, 'key.json');
    await writeFile(path, '{"kind":"wrong"}');
    await expect(readPrivateKeyFile(path)).rejects.toThrow('not a valid Nexine private key file');
  });
  it('throws on invalid public key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'test-'));
    const path = join(dir, 'pub.json');
    await writeFile(path, '{"kind":"wrong"}');
    await expect(readPublicKeyFile(path)).rejects.toThrow('not a valid Nexine public key file');
  });
});
