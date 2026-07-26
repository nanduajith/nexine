import { describe, expect, it } from 'vitest';

import { xmlToJson } from './transform';
describe('xml-json', () => {
  it('works', () => {
    expect(xmlToJson('<a>1</a>')).toContain('"a"');
  });
});
