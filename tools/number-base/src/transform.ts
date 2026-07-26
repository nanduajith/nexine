export type Base = 2 | 8 | 10 | 16;

export function convert(input: string, fromBase: Base, toBase: Base): string {
  input = input.trim();
  if (!input) return '';

  // Remove prefixes if present
  if (fromBase === 16 && input.toLowerCase().startsWith('0x')) {
    input = input.slice(2);
  } else if (fromBase === 2 && input.toLowerCase().startsWith('0b')) {
    input = input.slice(2);
  } else if (fromBase === 8 && input.toLowerCase().startsWith('0o')) {
    input = input.slice(2);
  }

  // Basic validation to prevent runtime crash
  const validRegex = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };

  if (!validRegex[fromBase].test(input)) {
    throw new Error(`Invalid base ${fromBase} number`);
  }

  try {
    // Parse using BigInt to support arbitrarily large numbers (larger than MAX_SAFE_INTEGER)
    let value: bigint;

    if (fromBase === 10) {
      value = BigInt(input);
    } else {
      // BigInt parsing requires prefixes for non-base 10
      const prefix = fromBase === 16 ? '0x' : fromBase === 8 ? '0o' : '0b';
      value = BigInt(prefix + input);
    }

    return value.toString(toBase);
  } catch (err) {
    throw new Error(`Could not convert input: ${err instanceof Error ? err.message : String(err)}`);
  }
}
