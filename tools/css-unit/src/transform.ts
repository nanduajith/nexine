export function pxToRem(px: string, base: number): string {
  const num = parseFloat(px);
  if (isNaN(num)) return '';
  return num / base + 'rem';
}
export function remToPx(rem: string, base: number): string {
  const num = parseFloat(rem);
  if (isNaN(num)) return '';
  return num * base + 'px';
}
