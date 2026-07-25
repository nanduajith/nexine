/**
 * A dependency-free styled console. Colors are disabled automatically when output
 * is not a TTY or `NO_COLOR` is set, so piped/CI output stays clean.
 */

const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

function paint(code: string, text: string): string {
  return useColor ? `[${code}m${text}[0m` : text;
}

export const style = {
  bold: (t: string) => paint('1', t),
  dim: (t: string) => paint('2', t),
  red: (t: string) => paint('31', t),
  green: (t: string) => paint('32', t),
  yellow: (t: string) => paint('33', t),
  cyan: (t: string) => paint('36', t),
};

export function info(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function success(message: string): void {
  process.stdout.write(`${style.green('✓')} ${message}\n`);
}

export function warn(message: string): void {
  process.stderr.write(`${style.yellow('!')} ${message}\n`);
}

export function error(message: string): void {
  process.stderr.write(`${style.red('✗')} ${message}\n`);
}
