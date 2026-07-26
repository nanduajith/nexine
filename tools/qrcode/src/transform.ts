import QRCode from 'qrcode';

export interface QROptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  scale: number;
  color: {
    dark: string;
    light: string;
  };
}

export async function generateSVG(
  input: string,
  options: Partial<QROptions> = {},
): Promise<string> {
  if (!input.trim()) return '';

  return new Promise((resolve, reject) => {
    QRCode.toString(
      input,
      {
        type: 'svg',
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        margin: options.margin ?? 4,
        scale: options.scale ?? 4,
        color: {
          dark: options.color?.dark || '#000000ff',
          light: options.color?.light || '#ffffffff',
        },
      },
      (err, string) => {
        if (err) reject(err);
        else resolve(string);
      },
    );
  });
}
