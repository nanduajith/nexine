
import * as fs from 'node:fs/promises';

import * as packaging from '@nexine/packaging';
import { describe, it, expect, vi } from 'vitest';

import * as bundle from '../bundle.js';

import { packCommand } from './pack.js';

vi.mock('../bundle.js');
vi.mock('node:fs/promises', async (importOriginal) => ({ ...(await importOriginal() as any), readFile: vi.fn() }));
vi.mock('@nexine/packaging');
vi.mock('../keyfile.js', () => ({ readPrivateKeyFile: vi.fn().mockResolvedValue({ publicKey: 'pub', privateKey: 'priv', keyId: 'id' }) }));

describe('packCommand', () => {
  it('errors without dir arg', async () => {
    expect(await packCommand({ positionals: [], flags: {} })).toBe(1);
  });
  it('errors without key flag', async () => {
    expect(await packCommand({ positionals: ['dir'], flags: {} })).toBe(1);
  });
  it('errors on manifest read failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('fail'));
    expect(await packCommand({ positionals: ['dir'], flags: { key: 'key.json' } })).toBe(1);
  });
  it('errors on bundle failure', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(bundle.bundlePlugin).mockRejectedValueOnce(new Error('fail'));
    expect(await packCommand({ positionals: ['dir'], flags: { key: 'key.json' } })).toBe(1);
  });
  it('errors on sign failure', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(bundle.bundlePlugin).mockResolvedValueOnce({ code: 'x', bytes: 1 });
    vi.mocked(packaging.signPackage).mockResolvedValueOnce({ ok: false, error: 'bad' });
    expect(await packCommand({ positionals: ['dir'], flags: { key: 'key.json' } })).toBe(1);
  });
});
