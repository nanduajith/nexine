import { describe, expect, it } from 'vitest';

import { tomlToJson, jsonToToml } from './transform';

describe('toml transform', () => {
  it('tomlToJson works', () => {
    const tomlStr = 'key = "value"\n';
    expect(tomlToJson(tomlStr)).toContain('"key": "value"');
  });
  it('tomlToJson returns empty on empty input', () => {
    expect(tomlToJson('')).toBe('');
  });

  it('jsonToToml works', () => {
    const jsonStr = '{"key": "value"}';
    expect(jsonToToml(jsonStr)).toContain('key = "value"');
  });
  it('jsonToToml returns empty on empty input', () => {
    expect(jsonToToml('')).toBe('');
  });
});