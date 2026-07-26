export function generatePassword(
  length: number,
  incLower: boolean,
  incUpper: boolean,
  incNum: boolean,
  incSym: boolean,
): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const num = '0123456789';
  const sym = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = '';
  if (incLower) chars += lower;
  if (incUpper) chars += upper;
  if (incNum) chars += num;
  if (incSym) chars += sym;

  if (!chars) return '';

  let result = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    result += chars[array[i]! % chars.length]!;
  }
  return result;
}
