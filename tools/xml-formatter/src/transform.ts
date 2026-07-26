import format from 'xml-formatter';
export function formatXml(xml: string, min: boolean): string {
  if (!xml) return '';
  return format(xml, {
    indentation: min ? '' : '  ',
    lineSeparator: min ? '' : '\n',
    collapseContent: true,
  });
}
