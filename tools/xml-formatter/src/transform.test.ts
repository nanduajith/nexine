import { describe, expect, it } from 'vitest';

import { formatXml } from './transform';
describe('xml-fmt', () => {
  it('works', () => {
    expect(formatXml('<a><b></b></a>', false)).toContain('\n');
  });
});
