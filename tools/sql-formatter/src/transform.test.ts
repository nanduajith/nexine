import { describe, expect, it } from 'vitest';

import { formatSql } from './transform';
describe('sql', () => {
  it('works', () => {
    expect(formatSql('select * from t')).toContain('SELECT');
  });
});
