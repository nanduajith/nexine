import { add, sub, formatISO } from 'date-fns';
export function doDateMath(
  dateStr: string,
  amount: number,
  unit: 'days' | 'months' | 'years',
  op: 'add' | 'sub',
): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error('Invalid');
  const res = op === 'add' ? add(d, { [unit]: amount }) : sub(d, { [unit]: amount });
  return formatISO(res);
}
