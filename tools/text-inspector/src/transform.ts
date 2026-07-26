export function inspectText(text: string): Record<string, number> {
  const chars = text.length;
  const bytes = new Blob([text]).size;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const words = text ? (text.match(/\w+/g) || []).length : 0;
  return { chars, bytes, lines, words };
}
