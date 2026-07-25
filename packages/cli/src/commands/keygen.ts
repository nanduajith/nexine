import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { generateKeyPair } from '@nexine/packaging';

import type { ParsedArgs } from '../args';
import { stringFlag } from '../args';
import { error, info, style, success, warn } from '../console';
import { writePrivateKeyFile, writePublicKeyFile } from '../keyfile';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** `nexine keygen [--out <dir>] [--label <name>] [--force]` */
export async function keygenCommand(args: ParsedArgs): Promise<number> {
  const outDir = resolve(stringFlag(args, 'out') ?? '.');
  const label = stringFlag(args, 'label');
  const force = args.flags.force === true;

  await mkdir(outDir, { recursive: true });
  const privatePath = resolve(outDir, 'nexine.key.json');
  const publicPath = resolve(outDir, 'nexine.pub.json');

  if (!force && ((await exists(privatePath)) || (await exists(publicPath)))) {
    error(`key files already exist in ${outDir} — pass --force to overwrite`);
    return 1;
  }

  const material = await generateKeyPair();

  await writePrivateKeyFile(privatePath, {
    kind: 'nexine-private-key',
    keyId: material.keyId,
    publicKey: material.publicKey,
    privateKey: material.privateKey,
    ...(label ? { label } : {}),
  });
  await writePublicKeyFile(publicPath, {
    kind: 'nexine-public-key',
    keyId: material.keyId,
    publicKey: material.publicKey,
    ...(label ? { label } : {}),
  });

  success(`generated signing key ${style.cyan(material.keyId)}`);
  info(`  ${style.dim('private')}  ${privatePath} ${style.dim('(0600)')}`);
  info(`  ${style.dim('public')}   ${publicPath}`);
  warn('keep nexine.key.json secret — anyone with it can sign packages as you');
  info(`distribute ${style.bold('nexine.pub.json')} so hosts can pin you in their trust store`);
  return 0;
}
