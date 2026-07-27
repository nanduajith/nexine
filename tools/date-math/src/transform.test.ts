import { describe, expect, it } from 'vitest';

import { doDateMath } from './transform';
describe('datemath', () => {
  it('adds days', () => expect(doDateMath('2020-01-01', 1, 'days', 'add')).toContain('2020-01-02'));
  it('subs days', () => expect(doDateMath('2020-01-02', 1, 'days', 'sub')).toContain('2020-01-01'));
  it('adds months', () => expect(doDateMath('2020-01-01', 1, 'months', 'add')).toContain('2020-02-01'));
  it('adds years', () => expect(doDateMath('2020-01-01', 1, 'years', 'add')).toContain('2021-01-01'));
  it('empty date', () => expect(doDateMath('', 1, 'days', 'add')).toBe(''));
  it('invalid date', () => expect(() => doDateMath('invalid', 1, 'days', 'add')).toThrow('Invalid'));
});