import { describe, expect, it } from 'vitest';

import { generateHmac } from './transform';

describe('hmac', () => {
  it('generates SHA-256 HMAC', async () => {
    const hash = await generateHmac('message', 'secret', 'SHA-256');
    expect(hash).toBe('8b5f48702995c1598c573db1e21866a9b825d4a794d169d7060a03605796360b');
  });
});
