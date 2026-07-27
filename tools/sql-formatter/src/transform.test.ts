import { describe, expect, it } from 'vitest';

import { formatSql } from './transform';

describe('sql-formatter transform', () => {
  it('formatSql works', () => {
    const sql = 'select * from users where id = 1';
    const formatted = formatSql(sql);
    expect(formatted).toContain('SELECT\n  *\nFROM\n  users\nWHERE\n  id = 1');
  });
  it('formatSql returns empty on empty input', () => {
    expect(formatSql('')).toBe('');
  });
});