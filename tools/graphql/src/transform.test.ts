import { describe, expect, it } from 'vitest';

import { formatGraphql } from './transform';
describe('graphql', () => {
  it('works', () => {
    expect(formatGraphql('{ a }')).toContain('{\n  a\n}');
  });
});
