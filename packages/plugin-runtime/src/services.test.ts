import { describe, expect, it } from 'vitest';

import { createNamespacedStorage, type KeyValueBackend } from './services';

class MemoryBackend implements KeyValueBackend {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
}

describe('createNamespacedStorage', () => {
  it('round-trips values within a namespace', async () => {
    const store = createNamespacedStorage('dev.a.tool', new MemoryBackend());
    await store.set('token', 'abc');
    expect(await store.get('token')).toBe('abc');
    await store.remove('token');
    expect(await store.get('token')).toBeNull();
  });

  it('isolates plugins sharing one backend', async () => {
    const backend = new MemoryBackend();
    const a = createNamespacedStorage('dev.a.tool', backend);
    const b = createNamespacedStorage('dev.b.tool', backend);

    await a.set('secret', 'from-a');
    await b.set('secret', 'from-b');

    expect(await a.get('secret')).toBe('from-a');
    expect(await b.get('secret')).toBe('from-b');
    expect(await a.keys()).toEqual(['secret']);
    expect(await b.keys()).toEqual(['secret']);
  });

  it('keys() lists only this plugin, never a neighbor', async () => {
    const backend = new MemoryBackend();
    const a = createNamespacedStorage('dev.a.tool', backend);
    const b = createNamespacedStorage('dev.b.tool', backend);
    await a.set('x', '1');
    await a.set('y', '2');
    await b.set('z', '3');
    expect((await a.keys()).sort()).toEqual(['x', 'y']);
  });

  it('does not collide when a dotted id + key alias another id + key', async () => {
    // Regression: with a `.` delimiter, plugin "a" + key "b.secret" and plugin
    // "a.b" + key "secret" both mapped to `...a.b.secret`, breaking isolation.
    // The `/` delimiter (which ids can't contain) keeps them distinct.
    const backend = new MemoryBackend();
    const a = createNamespacedStorage('a', backend);
    const ab = createNamespacedStorage('a.b', backend);

    await a.set('b.secret', 'from-a');
    await ab.set('secret', 'from-ab');

    expect(await a.get('b.secret')).toBe('from-a');
    expect(await ab.get('secret')).toBe('from-ab');
    // Neither can see the other's key through its own namespace.
    expect(await ab.get('b.secret')).toBeNull();
    expect(await a.keys()).toEqual(['b.secret']);
    expect(await ab.keys()).toEqual(['secret']);
  });

  it('rejects oversized values', async () => {
    const store = createNamespacedStorage('dev.a.tool', new MemoryBackend());
    const huge = 'x'.repeat(1_000_001);
    await expect(store.set('big', huge)).rejects.toThrow(/per-key limit/);
  });
});
