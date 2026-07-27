import { describe, it, expect, vi } from 'vitest';

import { generateSVG } from './transform';

vi.mock('qrcode', async () => {
  const actual: any = await vi.importActual('qrcode');
  return {
    default: {
      ...actual.default,
      toString: vi.fn((input, options, cb) => {
        if (input === 'FORCE_ERROR') cb(new Error('forced error'));
        else actual.default.toString(input, options, cb);
      }),
    },
  };
});
describe('generateSVG', () => {
  it('valid', async () => expect(await generateSVG('hello')).toContain('<svg'));
  it('empty', async () => expect(await generateSVG('   ')).toBe(''));
  it('options', async () => expect(await generateSVG('hello', { color: { dark: '#111', light: '#eee' }, margin: 2, scale: 2, errorCorrectionLevel: 'H' })).toContain('<svg'));
  it('partial options', async () => expect(await generateSVG('hello', { color: { dark: '', light: '' } })).toContain('<svg'));
  it('error', async () => await expect(generateSVG('FORCE_ERROR')).rejects.toThrow('forced error'));
});