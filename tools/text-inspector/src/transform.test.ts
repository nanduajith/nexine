import { describe, expect, it } from 'vitest';

import { inspectText } from './transform';
describe('inspector', () => {
  it('works', () => {
    expect(inspectText('Hello World').words).toBe(2);
  });
});
