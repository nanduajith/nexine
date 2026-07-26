import { format } from 'sql-formatter';
export function formatSql(sql: string): string {
  if (!sql) return '';
  return format(sql, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
}
