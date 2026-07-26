import { describe, expect, it } from 'vitest';

import { convertTimezone } from './transform';
describe('timezone', () => {
  it('works', () => {
    expect(convertTimezone('2024-01-01T00:00:00Z', 'UTC')).toContain('January');
  });
});
