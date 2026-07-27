import { describe, expect, it } from 'vitest';

import { formatGraphql } from './transform';

describe('graphql transform', () => {
  it('formatGraphql works', () => {
    const query = '{ user { id name } }';
    const formatted = formatGraphql(query);
    expect(formatted).toContain('{\n  user {\n    id\n    name\n  }\n}');
  });
  it('formatGraphql returns empty on empty input', () => {
    expect(formatGraphql('')).toBe('');
  });
});