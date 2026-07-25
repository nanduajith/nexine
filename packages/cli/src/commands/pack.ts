import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import { signPackage } from '@nexine/packaging';
import type { PluginManifest } from '@nexine/sdk';

import type { ParsedArgs } from '../args';
import { stringFlag } from '../args';
import { bundlePlugin } from '../bundle';
import { error, info, style, success } from '../console';
import { readPrivateKeyFile } from '../keyfile';
import { renderManifest } from '../report';

/**
 * `nexine pack <plugin-dir> --key <keyfile> [--entry src/index.ts] [--out file] [--no-minify]`
 *
 * Reads `<dir>/manifest.json`, bundles the source entry, signs the result and
 * writes a `.nexpkg`. Signing validates the manifest first, so an invalid plugin
 * fails here rather than at the user's host.
 */
export async function packCommand(args: ParsedArgs): Promise<number> {
  const dirArg = args.positionals[0];
  if (!dirArg) {
    error('usage: nexine pack <plugin-dir> --key <keyfile> [--entry <path>] [--out <file>]');
    return 1;
  }
  const dir = resolve(dirArg);
  const keyPath = stringFlag(args, 'key');
  if (!keyPath) {
    error('a signing key is required: --key <nexine.key.json>');
    return 1;
  }

  const manifestPath = resolve(dir, 'manifest.json');
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (e) {
    error(`could not read ${manifestPath}: ${(e as Error).message}`);
    return 1;
  }

  const entryRel = stringFlag(args, 'entry') ?? 'src/index.ts';
  const entryPath = isAbsolute(entryRel) ? entryRel : resolve(dir, entryRel);
  const minify = args.flags['no-minify'] !== true;

  let code: string;
  let bytes: number;
  try {
    ({ code, bytes } = await bundlePlugin(entryPath, minify));
  } catch (e) {
    error(`bundling ${entryPath} failed: ${(e as Error).message}`);
    return 1;
  }

  const key = await readPrivateKeyFile(keyPath);
  const signed = await signPackage({
    manifest,
    code,
    publicKey: key.publicKey,
    privateKey: key.privateKey,
  });
  if (!signed.ok) {
    error(signed.error);
    return 1;
  }

  const validManifest = signed.value.manifest as PluginManifest;
  const outPath = resolve(
    stringFlag(args, 'out') ?? resolve(dir, `${validManifest.id}-${validManifest.version}.nexpkg`),
  );
  await writeFile(outPath, `${JSON.stringify(signed.value, null, 2)}\n`, 'utf8');

  success(`packed ${style.bold(outPath)}`);
  for (const line of renderManifest(validManifest)) info(line);
  info(
    `  ${style.dim('bundle')}    ${(bytes / 1024).toFixed(1)} KiB${minify ? '' : style.dim(' (unminified)')}`,
  );
  info(`  ${style.dim('signedBy')}  ${style.cyan(key.keyId)}${key.label ? ` (${key.label})` : ''}`);
  return 0;
}
