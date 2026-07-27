
import * as fs from 'node:fs/promises';

import * as packaging from '@nexine/packaging';
import { describe, it, expect, vi } from 'vitest';

import { verifyCommand } from './verify.js';

vi.mock('node:fs/promises', async (importOriginal) => ({ ...(await importOriginal() as any), readFile: vi.fn() }));
vi.mock('@nexine/packaging');
vi.mock('../keyfile.js', () => ({ readPublicKeyFile: vi.fn().mockResolvedValue({ publicKey: 'pub' }) }));

describe('verifyCommand', () => {
  it('errors without file arg', async () => {
    expect(await verifyCommand({ positionals: [], flags: {} })).toBe(1);
  });
  it('errors on read failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('fail'));
    expect(await verifyCommand({ positionals: ['pkg'], flags: {} })).toBe(1);
  });
  it('errors on verify failure', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(packaging.verifyPackage).mockResolvedValueOnce({ ok: false, error: { reason: 'bad', message: 'err' } } as any);
    expect(await verifyCommand({ positionals: ['pkg'], flags: {} })).toBe(1);
  });
  it('succeeds for valid package and covers line 60 (trusted publisher)', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(packaging.verifyPackage).mockResolvedValueOnce({
      ok: true,
      value: {
        manifest: { id: 'test', version: '1', name: 't', category: 'data' },
        signer: { keyId: '123' },
        signedAt: 123,
        trusted: true
      }
    } as any);
    expect(await verifyCommand({ positionals: ['pkg'], flags: { trust: 'key.json' } })).toBe(0);
  });
});
