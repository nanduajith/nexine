import { XMLParser, XMLBuilder } from 'fast-xml-parser';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
});
export function xmlToJson(xml: string): string {
  if (!xml) return '';
  return JSON.stringify(parser.parse(xml), null, 2);
}
export function jsonToXml(json: string): string {
  if (!json) return '';
  return builder.build(JSON.parse(json));
}
