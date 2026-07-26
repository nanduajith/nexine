import { describe, expect, it } from 'vitest';

import { calcCidr } from './transform';
describe('cidr', () => {
  it('works', () => {
    expect(calcCidr('192.168.1.1/24').prefix).toBe('24');
  });
});
