/* eslint-disable import/order */
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

import { attachRpcHost } from "./rpc-host";

describe("attachRpcHost", () => {
  it("handles unsupported methods in handleRequest", async () => {
    const res = await handleRequest({ method: "unknown.method" } as any, [], services());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("unsupported");
  });

  it("handles nx:ready and nx:request messages", async () => {
    const { port1, port2 } = new MessageChannel();
    const handle = attachRpcHost({
      port: port1,
      manifest: { id: "dev.test", version: "1.0", entry: "a" } as any,
      granted: [{ id: "storage" }],
      pluginSource: "code",
      services: services(),
    });
    
    port2.postMessage({ type: "nx:ready" });
    const initEvent = await new Promise<any>((resolve) => {
      port2.onmessage = resolve;
    });
    expect(initEvent.data.type).toBe("nx:init");

    port2.postMessage({ type: "nx:request", id: 1, request: { method: "storage.get", key: "k" } });
    const responseEvent = await new Promise<any>((resolve) => {
      port2.onmessage = resolve;
    });
    expect(responseEvent.data.type).toBe("nx:response");
    expect(responseEvent.data.result.ok).toBe(true);

    handle.dispose();
  });

  it("handles nx:fatal messages", async () => {
    const { port1, port2 } = new MessageChannel();
    let fatalMessage = "";
    const handle = attachRpcHost({
      port: port1,
      manifest: {} as any,
      granted: [{ id: "storage" }],
      pluginSource: "code",
      services: services(),
      onFatal: (m) => { fatalMessage = m; },
    });
    port2.postMessage({ type: "nx:fatal", message: "fatal error" });
    await new Promise((r) => setTimeout(r, 20));
    expect(fatalMessage).toBe("fatal error");
    handle.dispose();
  });
});

describe("rpc-host storage methods", () => {
  it("handles storage.set and invalid arguments", async () => {
    const res = await handleRequest({ method: "storage.set", key: "k", value: 123 as any }, [{ id: "storage" }], services());
    expect(res.ok).toBe(false);
    
    const res2 = await handleRequest({ method: "storage.set", key: "k", value: "v" }, [{ id: "storage" }], services());
    expect(res2.ok).toBe(true);
  });

  it("handles storage.remove and invalid arguments", async () => {
    const res = await handleRequest({ method: "storage.remove", key: 123 as any }, [{ id: "storage" }], services());
    expect(res.ok).toBe(false);
    
    const res2 = await handleRequest({ method: "storage.remove", key: "k" }, [{ id: "storage" }], services());
    expect(res2.ok).toBe(true);
  });

  it("handles storage.keys", async () => {
    const res = await handleRequest({ method: "storage.keys" }, [{ id: "storage" }], services());
    expect(res.ok).toBe(true);
  });
});
