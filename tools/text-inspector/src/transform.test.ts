import { describe, expect, it } from 'vitest';

import { inspectText } from './transform';

describe('inspector', () => {
  it('returns zeros for empty input', () => {
    expect(inspectText('')).toEqual({ chars: 0, bytes: 0, lines: 0, words: 0 });
  });
  it('works', () => {
    expect(inspectText('Hello World').words).toBe(2);
    expect(inspectText('Hello World').lines).toBe(1);
    expect(inspectText('Hello World\nLine2').lines).toBe(2);
    expect(inspectText('NoWords !@#').words).toBe(1);
    expect(inspectText('😊').bytes).toBe(4);
  });
});