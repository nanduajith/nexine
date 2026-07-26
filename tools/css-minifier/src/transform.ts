import CleanCSS from 'clean-css';
export function minifyCss(css: string): string {
  if (!css) return '';
  return new CleanCSS({}).minify(css).styles;
}
