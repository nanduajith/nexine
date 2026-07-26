const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nexine-aes-salt'), // fixed salt for simplicity in a quick tool
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(text: string, passphrase: string): Promise<string> {
  if (!text || !passphrase) return '';
  const key = await getKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));

  // Combine IV + Ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(ciphertext: string, passphrase: string): Promise<string> {
  if (!ciphertext || !passphrase) return '';
  try {
    const raw = atob(ciphertext);
    const combined = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) combined[i] = raw.charCodeAt(i);

    if (combined.length < 12) throw new Error('Invalid ciphertext length');

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getKey(passphrase);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Decryption failed. Incorrect passphrase or corrupt data.');
  }
}
