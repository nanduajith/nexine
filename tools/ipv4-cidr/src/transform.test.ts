import { describe, expect, it } from 'vitest';

import { calcCidr } from './transform';
describe('cidr', () => {
  it('valid', () => {
    const res = calcCidr('192.168.1.1/24');
    expect(res.prefix).toBe('24');
    expect(res.ip).toBe('192.168.1.1');
    expect(res.type).toBeDefined();
  });
  it('invalid format', () => expect(calcCidr('invalid')).toEqual({ error: 'Invalid CIDR' }));
  it('invalid IP', () => expect(calcCidr('256.256.256.256/24')).toEqual({ error: 'Invalid CIDR' }));
});