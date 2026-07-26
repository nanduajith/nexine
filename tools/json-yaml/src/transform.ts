import yaml from 'js-yaml';

export type Format = 'json' | 'yaml';

export function convert(input: string, to: Format): string {
  if (!input.trim()) return '';

  let parsed: unknown;

  // Try parsing as JSON first, then YAML
  try {
    parsed = JSON.parse(input);
  } catch {
    try {
      parsed = yaml.load(input);
    } catch (err) {
      throw new Error(`Invalid input: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // If parsed is a string, it might have been unquoted text that yaml.load accepted.
  // We generally expect objects/arrays for JSON/YAML configs.
  if (
    typeof parsed === 'string' &&
    to === 'json' &&
    !input.startsWith('"') &&
    !input.startsWith('[')
  ) {
    // If it was just a raw string, we can wrap it, or just return it as a JSON string
  }

  if (to === 'json') {
    return JSON.stringify(parsed, null, 2);
  } else {
    return yaml.dump(parsed, {
      indent: 2,
      noRefs: true, // Don't use YAML anchors
      sortKeys: false, // Keep original order
    });
  }
}
