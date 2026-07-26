export function escapeStr(text: string): string {
  if (!text) return '';
  return JSON.stringify(text).slice(1, -1);
}
export function unescapeStr(text: string): string {
  if (!text) return '';
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    return text;
  }
}
