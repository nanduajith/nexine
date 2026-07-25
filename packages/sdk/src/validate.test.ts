import { describe, expect, it } from 'vitest';

import type { PluginManifest } from './manifest';
import { validateManifest } from './validate';

const base: PluginManifest = {
  manifestVersion: 1,
  id: 'dev.acme.csv',
  name: 'CSV Toolkit',
  version: '1.2.3',
  description: 'Convert and inspect CSV.',
  category: 'data',
  entry: 'dist/plugin.js',
};

function issues(input: unknown): string[] {
  const result = validateManifest(input);
  return result.ok ? [] : result.error.map((i) => i.path);
}

describe('validateManifest', () => {
  it('accepts a minimal valid manifest', () => {
    const result = validateManifest(base);
    expect(result.ok).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateManifest(null).ok).toBe(false);
    expect(validateManifest('x').ok).toBe(false);
    expect(validateManifest([]).ok).toBe(false);
  });

  it('rejects unsupported manifest versions', () => {
    expect(issues({ ...base, manifestVersion: 2 })).toContain('manifestVersion');
  });

  it('enforces id format', () => {
    expect(issues({ ...base, id: 'Bad Id!' })).toContain('id');
    expect(issues({ ...base, id: 'a.b-c.d' })).toEqual([]);
  });

  it('enforces semver', () => {
    expect(issues({ ...base, version: '1.2' })).toContain('version');
    expect(issues({ ...base, version: '1.2.3-beta.1' })).toEqual([]);
  });

  it('rejects unknown categories', () => {
    expect(issues({ ...base, category: 'nope' })).toContain('category');
  });

  it('rejects unsafe entry paths', () => {
    expect(issues({ ...base, entry: '/abs' })).toContain('entry');
    expect(issues({ ...base, entry: 'https://evil/x.js' })).toContain('entry');
    expect(issues({ ...base, entry: '../escape.js' })).toContain('entry');
  });

  it('validates network permission hosts as exact https origins', () => {
    const withNet = (hosts: unknown[]) => ({
      ...base,
      permissions: [{ id: 'network', hosts }],
      dataFlows: [{ destination: 'api', description: 'sends x' }],
    });
    expect(issues(withNet([]))).toContain('permissions[0].hosts');
    expect(issues(withNet(['http://api.example.com']))).toContain('permissions[0].hosts[0]');
    expect(issues(withNet(['https://api.example.com/path']))).toContain('permissions[0].hosts[0]');
    expect(issues(withNet(['https://*.example.com']))).toContain('permissions[0].hosts[0]');
    expect(issues(withNet(['https://api.example.com']))).toEqual([]);
    expect(issues(withNet(['http://localhost:8080']))).toEqual([]);
  });

  it('requires a dataFlow when network is requested', () => {
    const result = issues({
      ...base,
      permissions: [{ id: 'network', hosts: ['https://api.example.com'] }],
    });
    expect(result).toContain('dataFlows');
  });

  it('validates clipboard access values', () => {
    expect(issues({ ...base, permissions: [{ id: 'clipboard', access: 'paste' }] })).toContain(
      'permissions[0].access',
    );
    expect(issues({ ...base, permissions: [{ id: 'clipboard', access: 'read' }] })).toEqual([]);
  });

  it('rejects unknown permission ids', () => {
    expect(issues({ ...base, permissions: [{ id: 'filesystem' }] })).toContain('permissions[0].id');
  });

  it('strips unknown extra properties from the output', () => {
    const result = validateManifest({ ...base, evil: 'ignore me' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect('evil' in result.value).toBe(false);
    }
  });
});
