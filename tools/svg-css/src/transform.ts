export function svgToCss(svg: string): string {
  if (!svg) return '';
  const encoded = encodeURIComponent(svg.trim()).replace(/'/g, '%27').replace(/"/g, '%22');
  return `background-image: url("data:image/svg+xml,${encoded}");`;
}
