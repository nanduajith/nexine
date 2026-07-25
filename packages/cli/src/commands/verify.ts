import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createTrustStore, verifyPackage, type TrustedPublisher } from '@nexine/packaging';

import type { ParsedArgs } from '../args';
import { stringList } from '../args';
import { error, info, style, success, warn } from '../console';
import { readPublicKeyFile } from '../keyfile';
import { renderManifest } from '../report';

async function loadTrustStore(trustPaths: readonly string[]) {
  const publishers: TrustedPublisher[] = [];
  for (const path of trustPaths) {
    const pub = await readPublicKeyFile(resolve(path));
    publishers.push(
      pub.label ? { publicKey: pub.publicKey, label: pub.label } : { publicKey: pub.publicKey },
    );
  }
  return createTrustStore(publishers);
}

/**
 * `nexine verify <package.nexpkg> [--trust <pubkey.json> ...]`
 *
 * A cryptographically invalid package exits non-zero. A valid package signed by an
 * un-pinned key exits zero but is clearly flagged as untrusted — trust is the
 * host's decision, mirroring exactly what the runtime does at side-load.
 */
export async function verifyCommand(args: ParsedArgs): Promise<number> {
  const fileArg = args.positionals[0];
  if (!fileArg) {
    error('usage: nexine verify <package.nexpkg> [--trust <pubkey.json> ...]');
    return 1;
  }

  let pkg: unknown;
  try {
    pkg = JSON.parse(await readFile(resolve(fileArg), 'utf8'));
  } catch (e) {
    error(`could not read package: ${(e as Error).message}`);
    return 1;
  }

  const trustStore = await loadTrustStore(stringList(args, 'trust'));
  const result = await verifyPackage(pkg, { trustStore });

  if (!result.ok) {
    error(`invalid package (${result.error.reason}): ${result.error.message}`);
    return 1;
  }

  const { signer, trusted } = result.value;
  success('signature is valid — package is intact and authentic');
  info(
    `  ${style.dim('signer')}    ${style.cyan(signer.keyId)}${signer.label ? ` (${signer.label})` : ''}`,
  );
  info(`  ${style.dim('signedAt')}  ${new Date(result.value.signedAt).toISOString()}`);
  if (trusted) {
    info(`  ${style.dim('trust')}     ${style.green('trusted publisher (pinned)')}`);
  } else {
    warn('signer is NOT in the trust store — a host would require explicit consent to run this');
  }
  info('');
  for (const line of renderManifest(result.value.manifest)) info(line);
  return 0;
}
