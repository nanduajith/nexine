import { describe, expect, it } from 'vitest';

import { parseColor, rgbToHsl, hslToRgb } from './transform';
const parse = (input: string) => {
  const r = parseColor(input);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
describe('parseColor', () => {
  it('parses 6-digit hex', () => expect(parse('#ff8800').rgbString).toBe('rgb(255, 136, 0)'));
  it('parses 8-digit hex', () => expect(parse('#ff880080').rgb.a).toBeCloseTo(0.502, 2));
  it('expands 3-digit shorthand hex', () => expect(parse('#f80').rgb).toEqual({ r: 255, g: 136, b: 0, a: 1 }));
  it('expands 4-digit shorthand hex', () => expect(parse('#f808').rgb.a).toBeCloseTo(0.53, 2));
  it('hex invalid length', () => expect(parseColor('#12345').ok).toBe(false));
  it('hex invalid chars', () => expect(parseColor('#gg0011').ok).toBe(false));
  it('parses rgb()', () => expect(parse('rgb(16, 32, 48)').hex).toBe('#102030'));
  it('parses rgba()', () => expect(parse('rgba(16, 32, 48, 0.5)').rgb.a).toBe(0.5));
  it('parses rgb with percent', () => expect(parse('rgb(100%, 50%, 0%)').rgb).toEqual({ r: 100, g: 50, b: 0, a: 1 }));
  it('parses hsl()', () => expect(parse('hsl(32, 100%, 50%)').hex).toBe('#ff8800'));
  it('invalid fn syntax', () => expect(parseColor('rgb 255 255 255').ok).toBe(false));
  it('invalid rgb values', () => expect(parseColor('rgb(a, b, c)').ok).toBe(false));
  it('invalid hsl values', () => expect(parseColor('hsl(a, b, c)').ok).toBe(false));
  it('clamps out-of-range', () => expect(parse('rgb(300, -20, 0)').rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 }));
  it('empty input', () => expect(parseColor('   ').ok).toBe(false));
  it('unrecognized color', () => expect(parseColor('cmyk(0,0,0,0)').ok).toBe(false));
  it('handles pure black, white, gray hsl', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 0, l: 0, a: 1 });
    expect(rgbToHsl({ r: 255, g: 255, b: 255, a: 1 })).toEqual({ h: 0, s: 0, l: 100, a: 1 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128, a: 1 })).toEqual({ h: 0, s: 0, l: 50, a: 1 });
  });
  it('hslToRgb branches', () => {
    expect(hslToRgb({ h: 30, s: 100, l: 50, a: 1 }).r).toBe(255);
    expect(hslToRgb({ h: 90, s: 100, l: 50, a: 1 }).g).toBe(255);
    expect(hslToRgb({ h: 150, s: 100, l: 50, a: 1 }).g).toBe(255);
    expect(hslToRgb({ h: 210, s: 100, l: 50, a: 1 }).b).toBe(255);
    expect(hslToRgb({ h: 270, s: 100, l: 50, a: 1 }).b).toBe(255);
    expect(hslToRgb({ h: 330, s: 100, l: 50, a: 1 }).r).toBe(255);
  });
  it('rgbToHsl branches', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0, a: 1 }).h).toBe(0);
    expect(rgbToHsl({ r: 0, g: 255, b: 0, a: 1 }).h).toBe(120);
    expect(rgbToHsl({ r: 0, g: 0, b: 255, a: 1 }).h).toBe(240);
    expect(rgbToHsl({ r: 255, g: 0, b: 255, a: 1 }).h).toBe(300);
  });
});