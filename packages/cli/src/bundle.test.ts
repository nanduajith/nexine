
import * as esbuild from 'esbuild';
import { describe, it, expect, vi } from 'vitest';

import { bundlePlugin } from './bundle.js';

vi.mock('esbuild', () => ({
  build: vi.fn(),
}));

describe('bundlePlugin', () => {
  it('throws error when no output is produced', async () => {
    vi.mocked(esbuild.build).mockResolvedValueOnce({} as any);
    await expect(bundlePlugin('foo.ts')).rejects.toThrow('bundling produced no output');
  });
});
