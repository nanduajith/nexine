import { describe, expect, it } from 'vitest';

import { xmlToJson, jsonToXml } from './transform';

describe('xml-json transform', () => {
  it('xmlToJson works', () => {
    const xml = '<root><child>value</child></root>';
    const json = xmlToJson(xml);
    expect(json).toContain('"child": "value"');
  });
  it('xmlToJson returns empty on empty input', () => {
    expect(xmlToJson('')).toBe('');
  });

  it('jsonToXml works', () => {
    const json = '{"root":{"child":"value"}}';
    const xml = jsonToXml(json);
    expect(xml).toContain('<root>');
    expect(xml).toContain('<child>value</child>');
  });
  it('jsonToXml returns empty on empty input', () => {
    expect(jsonToXml('')).toBe('');
  });
});