
import * as fs from 'node:fs/promises';

import * as packaging from '@nexine/packaging';
import { describe, it, expect, vi } from 'vitest';

import { inspectCommand } from './inspect.js';

vi.mock('@nexine/packaging');
vi.mock('node:fs/promises');

describe('inspectCommand', () => {
  it('errors if no file arg', async () => {
    expect(await inspectCommand({ positionals: [], flags: {} })).toBe(1);
  });
  it('errors on read failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('fail'));
    expect(await inspectCommand({ positionals: ['pkg.nexpkg'], flags: {} })).toBe(1);
  });
  it('errors on invalid package', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(packaging.verifyPackage).mockResolvedValueOnce({ ok: false, error: { reason: 'bad', message: 'err' } } as any);
    expect(await inspectCommand({ positionals: ['pkg.nexpkg'], flags: {} })).toBe(1);
  });
  it('succeeds for valid package', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
    vi.mocked(packaging.verifyPackage).mockResolvedValueOnce({
      ok: true,
      value: {
        manifest: { id: 'test', version: '1', name: 't', category: 'data' },
        signer: { keyId: '123' },
        code: 'console.log()',
        trusted: false
      }
    } as any);
    expect(await inspectCommand({ positionals: ['pkg.nexpkg'], flags: {} })).toBe(0);
  });
});
