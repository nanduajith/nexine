import { describe, expect, it } from 'vitest';

import { generateHmac } from './transform';

describe('hmac', () => {
  it('generates SHA-1 HMAC', async () => {
    const hash = await generateHmac('message', 'secret', 'SHA-1');
    expect(hash).toBe('0caf649feee4953d87bf903ac1176c45e028df16');
  });

  it('generates SHA-256 HMAC', async () => {
    const hash = await generateHmac('message', 'secret', 'SHA-256');
    expect(hash).toBe('8b5f48702995c1598c573db1e21866a9b825d4a794d169d7060a03605796360b');
  });

  it('generates SHA-384 HMAC', async () => {
    const hash = await generateHmac('message', 'secret', 'SHA-384');
    expect(hash.length).toBe(96); 
  });

  it('generates SHA-512 HMAC', async () => {
    const hash = await generateHmac('message', 'secret', 'SHA-512');
    expect(hash.length).toBe(128);
  });

  it('returns empty string if message is empty', async () => {
    const hash = await generateHmac('', 'secret', 'SHA-256');
    expect(hash).toBe('');
  });

  it('returns empty string if secret is empty', async () => {
    const hash = await generateHmac('message', '', 'SHA-256');
    expect(hash).toBe('');
  });

  it('returns empty string if message and secret are empty', async () => {
    const hash = await generateHmac('', '', 'SHA-256');
    expect(hash).toBe('');
  });

  it('handles undefined message', async () => {
    const hash = await generateHmac(undefined as any, 'secret', 'SHA-256');
    expect(hash).toBe('');
  });

  it('handles null secret', async () => {
    const hash = await generateHmac('message', null as any, 'SHA-256');
    expect(hash).toBe('');
  });
});
