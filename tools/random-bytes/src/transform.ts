export function generateRandomBytes(bytes: number, encoding: 'hex' | 'base64'): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  if (encoding === 'base64') return btoa(String.fromCharCode(...arr));
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
