import Papa from 'papaparse';
export function csvToJson(csv: string): string {
  if (!csv) return '';
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return JSON.stringify(parsed.data, null, 2);
}
export function jsonToCsv(json: string): string {
  if (!json) return '';
  try {
    const obj = JSON.parse(json);
    return Papa.unparse(obj);
  } catch {
    return 'Invalid JSON';
  }
}
