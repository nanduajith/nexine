import { err, ok, type Result } from '@nexine/core';

/**
 * A pure, dependency-free color parser and converter. It accepts hex
 * (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), `rgb()/rgba()`, and `hsl()/hsla()`
 * syntax, and renders any parsed color into all three notations. Alpha is
 * preserved throughout. Everything is math on plain numbers, so it is trivially
 * unit-testable and never touches the network or the DOM.
 */

export interface Rgb {
  readonly r: number; // 0–255
  readonly g: number;
  readonly b: number;
  readonly a: number; // 0–1
}

export interface Hsl {
  readonly h: number; // 0–360
  readonly s: number; // 0–100
  readonly l: number; // 0–100
  readonly a: number; // 0–1
}

export interface ColorResult {
  readonly rgb: Rgb;
  readonly hsl: Hsl;
  readonly hex: string;
  readonly rgbString: string;
  readonly hslString: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n);

function parseHex(input: string): Result<Rgb> {
  const hex = input.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(hex)) return err('Hex contains non-hex characters.');

  let r: number;
  let g: number;
  let b: number;
  let a = 1;
  if (hex.length === 3 || hex.length === 4) {
    r = parseInt(hex[0]! + hex[0]!, 16);
    g = parseInt(hex[1]! + hex[1]!, 16);
    b = parseInt(hex[2]! + hex[2]!, 16);
    if (hex.length === 4) a = parseInt(hex[3]! + hex[3]!, 16) / 255;
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return err('Hex must be 3, 4, 6, or 8 digits.');
  }
  return ok({ r, g, b, a });
}

/** Pull the numeric/percentage components out of `rgb(...)` / `hsl(...)`. */
function components(input: string): Result<number[]> {
  const open = input.indexOf('(');
  const close = input.lastIndexOf(')');
  if (open === -1 || close === -1 || close < open) return err('Malformed function syntax.');
  const body = input.slice(open + 1, close);
  const parts = body
    .split(/[\s,/]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return ok(parts.map((p) => (p.endsWith('%') ? Number(p.slice(0, -1)) : Number(p))));
}

function parseRgbFn(input: string): Result<Rgb> {
  const parsed = components(input);
  if (!parsed.ok) return parsed;
  const [r, g, b, a = 1] = parsed.value;
  if ([r, g, b, a].some((n) => n === undefined || Number.isNaN(n)))
    return err('Invalid rgb() values.');
  return ok({
    r: clamp(round(r as number), 0, 255),
    g: clamp(round(g as number), 0, 255),
    b: clamp(round(b as number), 0, 255),
    a: clamp(a, 0, 1),
  });
}

function parseHslFn(input: string): Result<Rgb> {
  const parsed = components(input);
  if (!parsed.ok) return parsed;
  const [h, s, l, a = 1] = parsed.value;
  if ([h, s, l, a].some((n) => n === undefined || Number.isNaN(n)))
    return err('Invalid hsl() values.');
  return ok(hslToRgb({ h: h as number, s: s as number, l: l as number, a: clamp(a, 0, 1) }));
}

export function hslToRgb(hsl: Hsl): Rgb {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: round((r1 + m) * 255),
    g: round((g1 + m) * 255),
    b: round((b1 + m) * 255),
    a: hsl.a,
  };
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: round(h), s: round(s * 100), l: round(l * 100), a: rgb.a };
}

const toHex2 = (n: number) => clamp(round(n), 0, 255).toString(16).padStart(2, '0');

export function rgbToHex(rgb: Rgb): string {
  const base = `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
  return rgb.a < 1 ? `${base}${toHex2(rgb.a * 255)}` : base;
}

function fmtAlpha(a: number): string {
  return Number(a.toFixed(3)).toString();
}

export function rgbToString(rgb: Rgb): string {
  return rgb.a < 1
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fmtAlpha(rgb.a)})`
    : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function hslToString(hsl: Hsl): string {
  return hsl.a < 1
    ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${fmtAlpha(hsl.a)})`
    : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/** Parse any supported color notation into a full {@link ColorResult}. */
export function parseColor(input: string): Result<ColorResult> {
  const trimmed = input.trim();
  if (!trimmed) return err('Enter a color.');
  const lower = trimmed.toLowerCase();

  let rgb: Result<Rgb>;
  if (lower.startsWith('#')) rgb = parseHex(trimmed);
  else if (lower.startsWith('rgb')) rgb = parseRgbFn(trimmed);
  else if (lower.startsWith('hsl')) rgb = parseHslFn(trimmed);
  else return err('Unrecognized color. Use #hex, rgb(), or hsl().');

  if (!rgb.ok) return rgb;
  const hsl = rgbToHsl(rgb.value);
  return ok({
    rgb: rgb.value,
    hsl,
    hex: rgbToHex(rgb.value),
    rgbString: rgbToString(rgb.value),
    hslString: hslToString(hsl),
  });
}
