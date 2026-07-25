import type { Permission } from '@nexine/sdk';
import { describe, expect, it } from 'vitest';

import { buildPluginCsp, isNoEgressCsp } from './plugin-csp';

const NONCE = 'abc123';

describe('buildPluginCsp', () => {
  it('produces connect-src none for a plugin with no network grant', () => {
    const csp = buildPluginCsp({ granted: [], nonce: NONCE });
    expect(csp).toContain("connect-src 'none'");
    expect(isNoEgressCsp(csp)).toBe(true);
  });

  it('keeps connect-src none when only non-network permissions are granted', () => {
    const granted: Permission[] = [{ id: 'storage' }, { id: 'clipboard', access: 'read' }];
    expect(isNoEgressCsp(buildPluginCsp({ granted, nonce: NONCE }))).toBe(true);
  });

  it('allows exactly the granted network hosts in connect-src', () => {
    const granted: Permission[] = [
      { id: 'network', hosts: ['https://api.example.com', 'https://cdn.example.com'] },
    ];
    const csp = buildPluginCsp({ granted, nonce: NONCE });
    expect(csp).toContain('connect-src https://api.example.com https://cdn.example.com');
    expect(isNoEgressCsp(csp)).toBe(false);
  });

  it('deduplicates hosts across multiple network permissions', () => {
    const granted: Permission[] = [
      { id: 'network', hosts: ['https://api.example.com'] },
      { id: 'network', hosts: ['https://api.example.com'] },
    ];
    const csp = buildPluginCsp({ granted, nonce: NONCE });
    expect(csp).toContain('connect-src https://api.example.com;');
  });

  it('locks down default-src and embeds the bootstrap nonce', () => {
    const csp = buildPluginCsp({ granted: [], nonce: NONCE });
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain(`script-src 'nonce-${NONCE}' blob:`);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });
});
