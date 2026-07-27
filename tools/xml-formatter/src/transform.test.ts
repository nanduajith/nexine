import { describe, expect, it } from 'vitest';

import { formatXml } from './transform';

describe('xml-formatter transform', () => {
  it('formatXml works with min=false', () => {
    const xml = '<root><child>value</child></root>';
    const formatted = formatXml(xml, false);
    expect(formatted).toBe('<root>\n  <child>value</child>\n</root>');
  });
  it('formatXml works with min=true', () => {
    const xml = '<root><child>value</child></root>';
    const formatted = formatXml(xml, true);
    expect(formatted).toBe('<root><child>value</child></root>');
  });
  it('formatXml returns empty on empty input', () => {
    expect(formatXml('', false)).toBe('');
  });
});