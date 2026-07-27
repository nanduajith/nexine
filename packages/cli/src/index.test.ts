
import { describe, it, expect, vi } from 'vitest';

import * as inspect from './commands/inspect.js';

import { run } from './index.js';

vi.mock('./commands/inspect.js', () => ({
  inspectCommand: vi.fn(() => 0)
}));
vi.mock('./console.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  style: { bold: vi.fn(), dim: vi.fn() }
}));

describe('index', () => {
  it('runs inspect', async () => {
    await run(['inspect']);
    expect(inspect.inspectCommand).toHaveBeenCalled();
  });
  it('shows help for undefined', async () => {
    expect(await run([])).toBe(1);
  });
  it('shows help for --help', async () => {
    expect(await run(['--help'])).toBe(0);
  });
  it('shows error for unknown command', async () => {
    expect(await run(['unknown'])).toBe(1);
  });
});
