export function generatePlaceholder(
  w: number,
  h: number,
  text: string,
  bg: string,
  fg: string,
): string {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(w, h) * 0.2}px" fill="${fg}">${text}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
