export type HmacAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const encoder = new TextEncoder();

export async function generateHmac(
  message: string,
  secret: string,
  algorithm: HmacAlgorithm,
): Promise<string> {
  if (!message || !secret) return '';

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(message));

  // Convert to hex
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
