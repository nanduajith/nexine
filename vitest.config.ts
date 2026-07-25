import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Transforms are pure and run against Node's WebCrypto/TextEncoder — no DOM needed.
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts', 'tools/**/src/**/*.test.ts'],
  },
});
