import { describe, expect, it } from 'vitest';

import { createToolRegistry } from './registry';
import type { ToolMeta } from './types';

const jwt: ToolMeta = {
  id: 'jwt',
  name: 'JWT',
  description: 'Decode and verify JSON Web Tokens',
  category: 'crypto',
  keywords: ['token', 'jose'],
  sensitive: true,
};

const base64: ToolMeta = {
  id: 'base64',
  name: 'Base64',
  description: 'Encode and decode Base64',
  category: 'encoding',
  keywords: ['b64'],
};

describe('createToolRegistry', () => {
  it('registers and retrieves tools', () => {
    const emptyRegistry = createToolRegistry<ToolMeta>();
    expect(emptyRegistry.all()).toHaveLength(0);

    const registry = createToolRegistry<ToolMeta>([jwt, base64]);
    expect(registry.get('jwt')).toEqual(jwt);
    expect(registry.has('base64')).toBe(true);
    expect(registry.all()).toHaveLength(2);
  });

  it('rejects duplicate ids', () => {
    const registry = createToolRegistry<ToolMeta>([jwt]);
    expect(() => registry.register(jwt)).toThrow(/duplicate/i);
  });

  it('groups by category in display order (encoding before crypto)', () => {
    const base64Two: ToolMeta = { ...base64, id: 'base64-2', name: 'Base64-2' };
    const registry = createToolRegistry<ToolMeta>([jwt, base64, base64Two]);
    const grouped = registry.byCategory();
    expect(grouped.map(([category]) => category)).toEqual(['encoding', 'crypto']);
  });

  it('supports searching tools', () => {
    const registry = createToolRegistry<ToolMeta>([jwt, base64]);
    const results = registry.search('token');
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('jwt');
  });
});
