export function sortText(text: string, reverse: boolean, dedupe: boolean): string {
  if (!text) return '';
  let lines = text.split(/\r\n|\n/);
  if (dedupe) lines = [...new Set(lines)];
  lines.sort((a, b) => a.localeCompare(b));
  if (reverse) lines.reverse();
  return lines.join('\n');
}
