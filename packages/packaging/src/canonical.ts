/**
 * Deterministic JSON serialization. Signing and verification must produce the
 * *exact same bytes* on both sides, so we cannot rely on `JSON.stringify`'s
 * insertion-order key emission. This recursively sorts object keys and rejects
 * values that have no stable canonical form (functions, `undefined`, non-finite
 * numbers), so a signable structure can never silently serialize two ways.
 */

export class CanonicalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanonicalizationError';
  }
}

function canonicalize(value: unknown, path: string): string {
  if (value === null) return 'null';

  const type = typeof value;

  if (type === 'string') return JSON.stringify(value);

  if (type === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new CanonicalizationError(`non-finite number at ${path}`);
    }
    return JSON.stringify(value);
  }

  if (type === 'boolean') return value ? 'true' : 'false';

  if (Array.isArray(value)) {
    const items = value.map((item, i) => canonicalize(item, `${path}[${i}]`));
    return `[${items.join(',')}]`;
  }

  if (type === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries: string[] = [];
    for (const key of keys) {
      const child = record[key];
      // Drop explicit `undefined` members (mirrors JSON.stringify) so an
      // optional field being absent vs. `undefined` never changes the bytes.
      if (child === undefined) continue;
      entries.push(`${JSON.stringify(key)}:${canonicalize(child, `${path}.${key}`)}`);
    }
    return `{${entries.join(',')}}`;
  }

  throw new CanonicalizationError(`value of type ${type} at ${path} cannot be canonicalized`);
}

/** Serialize a value to its single canonical JSON string form. */
export function canonicalJson(value: unknown): string {
  return canonicalize(value, '$');
}
