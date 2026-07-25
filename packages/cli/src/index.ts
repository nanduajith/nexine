/**
 * The `nexine` CLI entry point, exported as a pure `run(argv)` so it can be driven
 * from tests as well as the `bin` shim. Every command returns a process exit code.
 */

import { parseArgs } from './args';
import { inspectCommand } from './commands/inspect';
import { keygenCommand } from './commands/keygen';
import { packCommand } from './commands/pack';
import { verifyCommand } from './commands/verify';
import { error, info, style } from './console';

const USAGE = `${style.bold('nexine')} — build and sign Nexine plugin packages

${style.dim('usage:')} nexine <command> [options]

${style.bold('commands:')}
  keygen   [--out <dir>] [--label <name>] [--force]   generate an Ed25519 signing keypair
  pack     <dir> --key <keyfile> [--entry <path>]     bundle + sign a plugin into a .nexpkg
           [--out <file>] [--no-minify]
  verify   <package> [--trust <pubkey.json> ...]      verify a package's signature and trust
  inspect  <package>                                  show a verified package's declarations

Everything runs locally — no network, no account. A package is a manifest + a
bundled classic-script module + a detached Ed25519 signature.`;

export async function run(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  switch (command) {
    case 'keygen':
      return keygenCommand(args);
    case 'pack':
      return packCommand(args);
    case 'verify':
      return verifyCommand(args);
    case 'inspect':
      return inspectCommand(args);
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      info(USAGE);
      return command === undefined ? 1 : 0;
    default:
      error(`unknown command: ${command}`);
      info(USAGE);
      return 1;
  }
}
