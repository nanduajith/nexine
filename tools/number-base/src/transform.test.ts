import { describe, it, expect } from 'vitest';

import { convert } from './transform';

describe('number-base transform', () => {
  it('converts base 10 to base 16', () => {
    expect(convert('255', 10, 16)).toBe('ff');
  });

  it('converts base 16 to base 2', () => {
    expect(convert('ff', 16, 2)).toBe('11111111');
  });

  it('ignores prefixes', () => {
    expect(convert('0xFF', 16, 10)).toBe('255');
  });

  it('handles empty input', () => {
    expect(convert('   ', 10, 16)).toBe('');
  });

  it('throws on invalid input', () => {
    expect(() => convert('123', 2, 10)).toThrow(/Invalid base 2 number/);
  });

  it('handles large numbers (BigInt)', () => {
    expect(convert('12345678901234567890', 10, 16)).toBe('ab54a98ceb1f0ad2');
  });
});
