import { marked } from 'marked';
export function parseMarkdown(md: string): string {
  if (!md) return '';
  return marked.parse(md) as string;
}
