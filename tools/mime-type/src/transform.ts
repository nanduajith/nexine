import mime from 'mime-types';
export function lookupMime(str: string): string {
  const isExt = !str.includes('/');
  if (isExt) {
    const res = mime.lookup(str);
    return res ? res : 'Unknown extension';
  } else {
    const res = mime.extension(str);
    return res ? res : 'Unknown MIME type';
  }
}
