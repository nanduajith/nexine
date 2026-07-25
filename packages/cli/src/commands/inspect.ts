import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { verifyPackage } from '@nexine/packaging';

import type { ParsedArgs } from '../args';
import { error, info, style, warn } from '../console';
import { renderManifest } from '../report';

/**
 * `nexine inspect <package.nexpkg>`
 *
 * Show what a package declares. It still verifies the signature first — an
 * inspector should never present tampered contents as if they were authoritative —
 * but reports details rather than a pass/fail verdict.
 */
export async function inspectCommand(args: ParsedArgs): Promise<number> {
  const fileArg = args.positionals[0];
  if (!fileArg) {
    error('usage: nexine inspect <package.nexpkg>');
    return 1;
  }

  let pkg: unknown;
  try {
    pkg = JSON.parse(await readFile(resolve(fileArg), 'utf8'));
  } catch (e) {
    error(`could not read package: ${(e as Error).message}`);
    return 1;
  }

  const result = await verifyPackage(pkg);
  if (!result.ok) {
    error(
      `cannot inspect — package failed verification (${result.error.reason}): ${result.error.message}`,
    );
    return 1;
  }

  for (const line of renderManifest(result.value.manifest)) info(line);
  info('');
  info(`  ${style.dim('signer')}    ${result.value.signer.keyId}`);
  info(
    `  ${style.dim('code')}      ${(result.value.code.length / 1024).toFixed(1)} KiB (inlined, self-contained)`,
  );
  warn('signature verified, but this signer is not pinned here — trust is decided by the host');
  return 0;
}
