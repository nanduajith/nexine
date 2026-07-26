import { describe, expect, it } from 'vitest';

import { doDateMath } from './transform';
describe('datemath', () => {
  it('works', () => {
    expect(doDateMath('2020-01-01', 1, 'days', 'add')).toContain('2020-01-02');
  });
});
