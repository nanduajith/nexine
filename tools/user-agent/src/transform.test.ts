import { describe, expect, it } from 'vitest';

import { parseUA } from './transform';
describe('user-agent', () => {
  it('works', () => {
    expect(parseUA('Mozilla/5.0').browser).toBeDefined();
  });
});
