import { describe, it, expect } from 'vitest';

import { generateRandomBytes } from './transform';
describe('generateRandomBytes', () => {
  it('hex', () => {
    const res = generateRandomBytes(4, 'hex');
    expect(res).toMatch(/^[0-9a-f]+$/);
    expect(res.length).toBe(8);
  });
  it('base64', () => expect(generateRandomBytes(4, 'base64')).toMatch(/^[a-zA-Z0-9+/]+={0,2}$/));
  it('0 bytes hex', () => expect(generateRandomBytes(0, 'hex')).toBe(''));
});