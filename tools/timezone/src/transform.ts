export function convertTimezone(dateStr: string, tz: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error('Invalid Date');
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(d);
}
