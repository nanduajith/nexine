import { nanoid } from 'nanoid';
export function generateNanoId(size: number = 21): string {
  return nanoid(size);
}
