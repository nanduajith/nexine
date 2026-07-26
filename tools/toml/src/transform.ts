import toml from '@iarna/toml';
export function tomlToJson(str: string): string {
  if (!str) return '';
  return JSON.stringify(toml.parse(str), null, 2);
}
export function jsonToToml(json: string): string {
  if (!json) return '';
  return toml.stringify(JSON.parse(json));
}
