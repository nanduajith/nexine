import { describe, expect, it } from 'vitest';

import { searchTools } from './search';
import type { ToolMeta } from './types';

const tools: ToolMeta[] = [
  { id: 'jwt', name: 'JWT', description: 'Decode and verify JSON Web Tokens', category: 'crypto', keywords: ['token', 'jose'], sensitive: true },
  { id: 'base64', name: 'Base64', description: 'Encode and decode Base64', category: 'encoding', keywords: ['b64', 'encode'], sensitive: false },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate UUIDs v4', category: 'generators', keywords: ['guid'], sensitive: false },
];

describe('searchTools', () => {
  it('returns all tools if query is empty or whitespace', () => {
    expect(searchTools(tools, '')).toEqual(tools);
    expect(searchTools(tools, '   ')).toEqual(tools);
  });

  it('matches exact name or id with highest score', () => {
    const results = searchTools(tools, 'jwt');
    expect(results[0]?.id).toBe('jwt');
  });

  it('matches name prefix', () => {
    const results = searchTools(tools, 'base');
    expect(results[0]?.id).toBe('base64');
  });

  it('matches name contains', () => {
    const results = searchTools(tools, '64');
    expect(results[0]?.id).toBe('base64');
  });

  it('matches id contains', () => {
    const results = searchTools(tools, 'wt');
    expect(results[0]?.id).toBe('jwt');
  });

  it('matches keyword exact', () => {
    const results = searchTools(tools, 'token');
    expect(results[0]?.id).toBe('jwt');
  });

  it('matches keyword prefix', () => {
    const results = searchTools(tools, 'tok');
    expect(results[0]?.id).toBe('jwt');
  });

  it('matches keyword contains', () => {
    const results = searchTools(tools, 'ok');
    expect(results[0]?.id).toBe('jwt');
  });

  it('matches description contains', () => {
    const results = searchTools(tools, 'verify');
    expect(results[0]?.id).toBe('jwt');
  });

  it('returns empty array if no matches', () => {
    expect(searchTools(tools, 'nonexistent')).toEqual([]);
  });

  it('sorts by score descending, then by name alphabetically', () => {
    const t: ToolMeta[] = [
      { id: 't1', name: 'Zebra encode', description: '', category: 'encoding', keywords: ['encode'], sensitive: false },
      { id: 't2', name: 'Apple encode', description: '', category: 'encoding', keywords: ['encode'], sensitive: false },
      { id: 't3', name: 'encode exact', description: '', category: 'encoding', keywords: ['encode'], sensitive: false }
    ];
    const results = searchTools(t, 'encode');
    expect(results.map(r => r.id)).toEqual(['t3', 't2', 't1']);
  });
});
