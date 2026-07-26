import jp from 'jsonpath';
export function evaluateJsonPath(json: string, path: string): string {
  if (!json || !path) return '';
  try {
    const obj = JSON.parse(json);
    const result = jp.query(obj, path);
    return JSON.stringify(result, null, 2);
  } catch (err) {
    return String(err);
  }
}
