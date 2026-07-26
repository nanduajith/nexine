import { describe, expect, it } from 'vitest';

import { generatePassword } from './transform';
describe('password-gen', () => {
  it('works', () => {
    expect(generatePassword(10, true, false, false, false)).toHaveLength(10);
  });
});
