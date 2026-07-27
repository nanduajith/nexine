import { describe, it, expect } from 'vitest';

import { decodeSnowflake } from './transform';
describe('decodeSnowflake', () => {
  it('decodes', () => {
    const res = decodeSnowflake('175928847299117063');
    expect(res.timestamp).toBeInstanceOf(Date);
    expect(typeof res.worker).toBe('number');
    expect(typeof res.process).toBe('number');
    expect(typeof res.increment).toBe('number');
  });
  it('throws', () => expect(() => decodeSnowflake('invalid')).toThrow('Invalid Snowflake ID'));
});