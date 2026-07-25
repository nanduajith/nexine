import type { Permission } from '@nexine/sdk';
import { describe, expect, it, vi } from 'vitest';

import { handleRequest, type HostServices } from './rpc-host';

function services(): HostServices {
  return {
    storage: {
      get: vi.fn(async () => 'stored'),
      set: vi.fn(async () => {}),
      remove: vi.fn(async () => {}),
      keys: vi.fn(async () => ['a', 'b']),
    },
    clipboard: {
      readText: vi.fn(async () => 'clip'),
      writeText: vi.fn(async () => {}),
    },
  };
}

describe('handleRequest permission gating', () => {
  it('denies storage without the storage permission', async () => {
    const res = await handleRequest({ method: 'storage.get', key: 'k' }, [], services());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('denied');
  });

  it('allows storage when granted', async () => {
    const granted: Permission[] = [{ id: 'storage' }];
    const res = await handleRequest({ method: 'storage.get', key: 'k' }, granted, services());
    expect(res).toEqual({ ok: true, value: 'stored' });
  });

  it('enforces clipboard sub-scopes', async () => {
    const readOnly: Permission[] = [{ id: 'clipboard', access: 'read' }];
    const writeOnly: Permission[] = [{ id: 'clipboard', access: 'write' }];

    expect((await handleRequest({ method: 'clipboard.readText' }, readOnly, services())).ok).toBe(
      true,
    );
    expect(
      (await handleRequest({ method: 'clipboard.writeText', text: 'x' }, readOnly, services())).ok,
    ).toBe(false);
    expect(
      (await handleRequest({ method: 'clipboard.writeText', text: 'x' }, writeOnly, services())).ok,
    ).toBe(true);
    expect((await handleRequest({ method: 'clipboard.readText' }, writeOnly, services())).ok).toBe(
      false,
    );
  });

  it('rejects malformed requests before reaching a service', async () => {
    const svc = services();
    // A malicious guest can send any runtime shape; a non-string key must be
    // refused as `invalid` and never reach the (namespace-prefixing) backend.
    const res = await handleRequest(
      { method: 'storage.get', key: 42 as unknown as string },
      [{ id: 'storage' }],
      svc,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('invalid');
    expect(svc.storage.get).not.toHaveBeenCalled();
  });

  it('reports service errors as internal, not thrown', async () => {
    const svc = services();
    (svc.storage.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('disk full'));
    const res = await handleRequest(
      { method: 'storage.set', key: 'k', value: 'v' },
      [{ id: 'storage' }],
      svc,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('internal');
  });
});
