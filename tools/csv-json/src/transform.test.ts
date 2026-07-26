import { describe, expect, it } from 'vitest';

import { csvToJson } from './transform';
describe('csv', () => {
  it('works', () => {
    expect(csvToJson('a,b\n1,2')).toContain('"a": "1"');
  });
});
