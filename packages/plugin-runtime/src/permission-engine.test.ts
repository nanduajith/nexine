import type { PluginManifest } from '@nexine/sdk';
import { describe, expect, it } from 'vitest';

import { resolvePermissions, type PluginPolicy } from './permission-engine';

function manifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    manifestVersion: 1,
    id: 'dev.acme.tool',
    name: 'Tool',
    version: '1.0.0',
    description: 'A tool.',
    category: 'data',
    entry: 'plugin.js',
    ...overrides,
  };
}

describe('resolvePermissions', () => {
  it('grants requested permissions under the default policy', () => {
    const m = manifest({
      permissions: [{ id: 'network', hosts: ['https://api.example.com'] }, { id: 'storage' }],
      dataFlows: [{ destination: 'api.example.com', description: 'sends payload' }],
    });
    const res = resolvePermissions(m);
    expect(res.allowedToLoad).toBe(true);
    expect(res.granted).toHaveLength(2);
  });

  it('grants nothing to a plugin that requests nothing', () => {
    const res = resolvePermissions(manifest());
    expect(res.allowedToLoad).toBe(true);
    expect(res.granted).toEqual([]);
  });

  it('blocks a plugin on the block list', () => {
    const policy: PluginPolicy = { mode: 'allow', blockedPlugins: ['dev.acme.tool'] };
    const res = resolvePermissions(manifest({ permissions: [{ id: 'storage' }] }), policy);
    expect(res.allowedToLoad).toBe(false);
    expect(res.granted).toEqual([]);
    expect(res.decisions[0]?.reason).toMatch(/not permitted to load/);
  });

  it('lockdown denies plugins not on the allow list', () => {
    const policy: PluginPolicy = { mode: 'lockdown', allowedPlugins: ['dev.other.tool'] };
    expect(resolvePermissions(manifest(), policy).allowedToLoad).toBe(false);
  });

  it('lockdown permits plugins on the allow list', () => {
    const policy: PluginPolicy = { mode: 'lockdown', allowedPlugins: ['dev.acme.tool'] };
    expect(resolvePermissions(manifest(), policy).allowedToLoad).toBe(true);
  });

  it('applies a permission ceiling (deniedPermissions)', () => {
    const policy: PluginPolicy = { mode: 'allow', deniedPermissions: ['network'] };
    const m = manifest({
      permissions: [{ id: 'network', hosts: ['https://api.example.com'] }, { id: 'storage' }],
      dataFlows: [{ destination: 'api', description: 'x' }],
    });
    const res = resolvePermissions(m, policy);
    expect(res.granted.map((p) => p.id)).toEqual(['storage']);
  });

  it('narrows network hosts to the policy host ceiling', () => {
    const policy: PluginPolicy = { mode: 'allow', allowedHosts: ['https://ok.example.com'] };
    const m = manifest({
      permissions: [
        { id: 'network', hosts: ['https://ok.example.com', 'https://blocked.example.com'] },
      ],
      dataFlows: [{ destination: 'ok', description: 'x' }],
    });
    const res = resolvePermissions(m, policy);
    const net = res.granted.find((p) => p.id === 'network');
    expect(net).toEqual({ id: 'network', hosts: ['https://ok.example.com'] });
  });

  it('denies network entirely when no requested host is within the ceiling', () => {
    const policy: PluginPolicy = { mode: 'allow', allowedHosts: ['https://only.example.com'] };
    const m = manifest({
      permissions: [{ id: 'network', hosts: ['https://api.example.com'] }],
      dataFlows: [{ destination: 'api', description: 'x' }],
    });
    const res = resolvePermissions(m, policy);
    expect(res.granted).toEqual([]);
  });
});
