import { describe, it, expect } from 'vitest';

import { generateFakeData } from './transform';
describe('generateFakeData', () => {
  it('person', () => expect(generateFakeData('person')).toContain('\n'));
  it('address', () => expect(generateFakeData('address')).toContain(', '));
  it('company', () => expect(generateFakeData('company')).toContain(' - '));
  it('creditCard', () => expect(typeof generateFakeData('creditCard')).toBe('string'));
  it('invalid', () => expect(generateFakeData('invalid' as any)).toBe(''));
});