import { describe, it, expect } from 'vitest';

import { generatePassword } from './transform';
describe('generatePassword', () => {
  it('length', () => expect(generatePassword(10, true, false, false, false).length).toBe(10));
  it('lower', () => expect(generatePassword(10, true, false, false, false)).toMatch(/^[a-z]+$/));
  it('upper', () => expect(generatePassword(10, false, true, false, false)).toMatch(/^[A-Z]+$/));
  it('num', () => expect(generatePassword(10, false, false, true, false)).toMatch(/^[0-9]+$/));
  it('sym', () => expect(generatePassword(10, false, false, false, true)).toMatch(/^[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/));
  it('none', () => expect(generatePassword(10, false, false, false, false)).toBe(''));
  it('len 0', () => expect(generatePassword(0, true, true, true, true)).toBe(''));
});