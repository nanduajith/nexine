import { describe, it, expect } from 'vitest';

import { convert } from './transform';
describe('number-base', () => {
  it('10 to 16', () => expect(convert('255', 10, 16)).toBe('ff'));
  it('16 to 2', () => expect(convert('ff', 16, 2)).toBe('11111111'));
  it('ignores prefixes 16', () => expect(convert('0xFF', 16, 10)).toBe('255'));
  it('ignores prefixes 2', () => expect(convert('0b10', 2, 10)).toBe('2'));
  it('ignores prefixes 8', () => expect(convert('0o10', 8, 10)).toBe('8'));
  it('empty', () => expect(convert('   ', 10, 16)).toBe(''));
  it('invalid 2', () => expect(() => convert('123', 2, 10)).toThrow(/Invalid base 2 number/));
  it('invalid 8', () => expect(() => convert('89', 8, 10)).toThrow(/Invalid base 8 number/));
  it('invalid 10', () => expect(() => convert('abc', 10, 16)).toThrow(/Invalid base 10 number/));
  it('invalid 16', () => expect(() => convert('ghi', 16, 10)).toThrow(/Invalid base 16 number/));
  it('large numbers', () => expect(convert('12345678901234567890', 10, 16)).toBe('ab54a98ceb1f0ad2'));
});