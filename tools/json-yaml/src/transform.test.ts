import { describe, it, expect } from 'vitest';

import { convert } from './transform';

describe('json-yaml transform', () => {
  it('converts basic json to yaml', () => {
    const json = '{"name": "test", "value": 123}';
    const yml = convert(json, 'yaml');
    expect(yml).toContain('name: test');
    expect(yml).toContain('value: 123');
  });

  it('converts nested yaml to json', () => {
    const yml = `
server:
  port: 8080
  host: localhost
`;
    const json = convert(yml, 'json');
    const parsed = JSON.parse(json);
    expect(parsed.server.port).toBe(8080);
    expect(parsed.server.host).toBe('localhost');
  });

  it('handles empty input', () => {
    expect(convert('   ', 'json')).toBe('');
  });

  it('throws on invalid input', () => {
    expect(() => convert('[ { : invalid yaml', 'json')).toThrow(/Invalid input/);
  });
  
  it('throws on non-Error error', () => {
    expect(() => convert('{', 'yaml')).toThrow();
  });

  it('handles raw strings to json without quotes', () => {
    const res = convert('justastring', 'json');
    expect(res).toBe('"justastring"');
  });
});