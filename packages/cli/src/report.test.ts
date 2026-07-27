
import { describe, it, expect } from 'vitest';

import { renderManifest } from './report.js';

describe('report', () => {
  it('renders network and clipboard perms', () => {
    const out = renderManifest({
      id: 'test', version: '1', name: 't', category: 'data',
      permissions: [{ id: 'network', hosts: ['a', 'b'] }, { id: 'clipboard', access: 'read' }]
    } as any);
    expect(out.join('\n')).toContain('network → a, b');
    expect(out.join('\n')).toContain('clipboard (read)');
  });
  it('renders none if no perms', () => {
    const out = renderManifest({
      id: 'test', version: '1', name: 't', category: 'data'
    } as any);
    expect(out.join('\n')).toContain('none — fully sandboxed, zero egress');
  });
  it('renders dataFlows', () => {
    const out = renderManifest({
      id: 'test', version: '1', name: 't', category: 'data',
      dataFlows: [{ destination: 'foo', description: 'bar', optional: true }, { destination: 'baz', description: 'qux' }]
    } as any);
    expect(out.join('\n')).toContain('foo — bar');
    expect(out.join('\n')).toContain('(optional)');
  });
});
