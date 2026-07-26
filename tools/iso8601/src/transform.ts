export function parseIso(str: string): Record<string, string> {
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new Error('Invalid ISO string');
  return {
    utc: d.toUTCString(),
    local: d.toString(),
    timestamp: d.getTime().toString(),
    iso: d.toISOString(),
  };
}
