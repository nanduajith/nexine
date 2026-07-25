import { run } from './index';

run(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((e: unknown) => {
    process.stderr.write(`nexine: ${(e as Error).message}\n`);
    process.exitCode = 1;
  });
