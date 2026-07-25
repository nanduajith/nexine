/**
 * On-disk representation of signing keys. The private key file is written with
 * `0600` permissions and a loud filename; it must never be committed or shared.
 * The public key file is safe to distribute — it is what a host pins in its trust
 * store to trust this publisher's packages.
 */

import { chmod, readFile, writeFile } from 'node:fs/promises';

export interface PublicKeyFile {
  readonly kind: 'nexine-public-key';
  readonly keyId: string;
  readonly publicKey: string;
  readonly label?: string;
}

export interface PrivateKeyFile {
  readonly kind: 'nexine-private-key';
  readonly keyId: string;
  readonly publicKey: string;
  readonly privateKey: string;
  readonly label?: string;
}

const PRIVATE_MODE = 0o600;

export async function writePrivateKeyFile(path: string, key: PrivateKeyFile): Promise<void> {
  await writeFile(path, `${JSON.stringify(key, null, 2)}\n`, {
    encoding: 'utf8',
    mode: PRIVATE_MODE,
  });
  // writeFile only applies mode on creation; enforce it explicitly for overwrites.
  await chmod(path, PRIVATE_MODE);
}

export async function writePublicKeyFile(path: string, key: PublicKeyFile): Promise<void> {
  await writeFile(path, `${JSON.stringify(key, null, 2)}\n`, 'utf8');
}

export async function readPrivateKeyFile(path: string): Promise<PrivateKeyFile> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<PrivateKeyFile>;
  if (
    parsed.kind !== 'nexine-private-key' ||
    typeof parsed.publicKey !== 'string' ||
    typeof parsed.privateKey !== 'string' ||
    typeof parsed.keyId !== 'string'
  ) {
    throw new Error(`${path} is not a valid Nexine private key file`);
  }
  return parsed as PrivateKeyFile;
}

export async function readPublicKeyFile(path: string): Promise<PublicKeyFile> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<PublicKeyFile>;
  if (
    parsed.kind !== 'nexine-public-key' ||
    typeof parsed.publicKey !== 'string' ||
    typeof parsed.keyId !== 'string'
  ) {
    throw new Error(`${path} is not a valid Nexine public key file`);
  }
  return parsed as PublicKeyFile;
}
