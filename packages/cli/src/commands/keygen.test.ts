
import * as fs from 'node:fs/promises';

import { describe, it, expect, vi } from 'vitest';

import { keygenCommand } from './keygen.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    access: vi.fn(),
  };
});

describe('keygenCommand', () => {
  it('errors if keys exist and no force', async () => {
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    expect(await keygenCommand({ positionals: [], flags: {} })).toBe(1);
  });
});
