import { UAParser, type IResult } from 'ua-parser-js';
export function parseUA(ua: string): IResult {
  const parser = new UAParser(ua);
  return parser.getResult();
}
