import { describe, expect, it } from 'vitest';

import { csvToJson, jsonToCsv } from './transform';

describe('csv-json transform', () => {
  it('csvToJson works', () => {
    expect(csvToJson('a,b\n1,2')).toContain('"a": "1"');
  });
  it('csvToJson returns empty on empty input', () => {
    expect(csvToJson('')).toBe('');
  });
  
  it('jsonToCsv works', () => {
    expect(jsonToCsv('[{"a":"1","b":"2"}]')).toContain('a,b');
  });
  it('jsonToCsv returns empty on empty input', () => {
    expect(jsonToCsv('')).toBe('');
  });
  it('jsonToCsv handles invalid json', () => {
    expect(jsonToCsv('invalid')).toBe('Invalid JSON');
  });
});