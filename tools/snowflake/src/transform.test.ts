import { describe, expect, it } from 'vitest';

import { decodeSnowflake } from './transform';
describe('snowflake', () => {
  it('works', () => {
    const s = decodeSnowflake('175928847299117063');
    expect(s.timestamp.getTime()).toBeGreaterThan(0);
  });
});
