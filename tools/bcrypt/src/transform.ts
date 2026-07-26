import bcrypt from 'bcryptjs';

export function hash(password: string, rounds: number = 10): string {
  if (!password) return '';
  return bcrypt.hashSync(password, rounds);
}

export function verify(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}
