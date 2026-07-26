import { describe, it, expect } from 'vitest';

import { generateSVG } from './transform';

describe('qrcode transform', () => {
  it('generates an SVG string for input text', async () => {
    const svg = await generateSVG('hello world');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('handles empty input', async () => {
    expect(await generateSVG('   ')).toBe('');
  });

  it('respects options', async () => {
    const svg = await generateSVG('test', { color: { dark: '#ff0000', light: '#000000' } });
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#000000');
  });
});
