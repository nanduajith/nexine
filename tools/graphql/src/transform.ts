import { parse, print } from 'graphql';
export function formatGraphql(query: string): string {
  if (!query) return '';
  return print(parse(query));
}
