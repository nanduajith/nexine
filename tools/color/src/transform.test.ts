import { describe, expect, it } from 'vitest';

import { parseColor, rgbToHsl, hslToRgb } from './transform';

const parse = (input: string) => {
  const r = parseColor(input);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    const c = parse('#ff8800');
    expect(c.rgb).toEqual({ r: 255, g: 136, b: 0, a: 1 });
    expect(c.rgbString).toBe('rgb(255, 136, 0)');
    expect(c.hslString).toBe('hsl(32, 100%, 50%)');
  });

  it('expands 3-digit shorthand hex', () => {
    expect(parse('#f80').rgb).toEqual({ r: 255, g: 136, b: 0, a: 1 });
  });

  it('parses hex with alpha', () => {
    const c = parse('#ff880080');
    expect(c.rgb.a).toBeCloseTo(0.502, 2);
    expect(c.rgbString).toMatch(/^rgba\(255, 136, 0, 0\.5/);
  });

  it('parses rgb() and rgba()', () => {
    expect(parse('rgb(16, 32, 48)').hex).toBe('#102030');
    expect(parse('rgba(16, 32, 48, 0.5)').rgb.a).toBe(0.5);
  });

  it('parses hsl() and round-trips to the same hex', () => {
    const c = parse('hsl(32, 100%, 50%)');
    expect(c.hex).toBe('#ff8800');
  });

  it('parses the modern slash-alpha syntax', () => {
    expect(parse('rgb(255 136 0 / 0.5)').rgb.a).toBe(0.5);
  });

  it('clamps out-of-range channel values', () => {
    expect(parse('rgb(300, -20, 0)').rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('rejects malformed input', () => {
    expect(parseColor('').ok).toBe(false);
    expect(parseColor('#gg0011').ok).toBe(false);
    expect(parseColor('#12345').ok).toBe(false);
    expect(parseColor('cmyk(0,0,0,0)').ok).toBe(false);
  });

  it('handles pure black, white, and gray hsl correctly', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 0, l: 0, a: 1 });
    expect(rgbToHsl({ r: 255, g: 255, b: 255, a: 1 })).toEqual({ h: 0, s: 0, l: 100, a: 1 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128, a: 1 })).toEqual({ h: 0, s: 0, l: 50, a: 1 });
  });

  it('rgb→hsl→rgb round-trips a saturated color', () => {
    const rgb = { r: 12, g: 200, b: 90, a: 1 };
    const back = hslToRgb(rgbToHsl(rgb));
    expect(back.r).toBeCloseTo(rgb.r, -1);
    expect(back.g).toBeCloseTo(rgb.g, -1);
    expect(back.b).toBeCloseTo(rgb.b, -1);
  });
});
