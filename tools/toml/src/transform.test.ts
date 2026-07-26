import { describe, expect, it } from 'vitest';

import { tomlToJson } from './transform';
describe('toml', () => {
  it('works', () => {
    expect(tomlToJson('a = 1')).toContain('"a"');
  });
});
