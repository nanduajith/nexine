export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export type RsaLength = 1024 | 2048 | 4096;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function wrapPem(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const lines = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

export async function generateRsaKeys(length: RsaLength): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: length,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const pubBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = wrapPem(arrayBufferToBase64(pubBuffer), 'PUBLIC KEY');
  const privateKey = wrapPem(arrayBufferToBase64(privBuffer), 'PRIVATE KEY');

  return { publicKey, privateKey };
}
