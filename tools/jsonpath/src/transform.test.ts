import { describe, expect, it } from 'vitest';

import { evaluateJsonPath } from './transform';
describe('jsonpath', () => {
  it('works', () => {
    expect(evaluateJsonPath('{"a":1}', '$.a')).toContain('1');
  });
});
