#!/usr/bin/env node
// Release helper: bump the app version everywhere it lives, commit, tag, and push.
//
// The version is the single source of truth for a release. It appears in four files
// that MUST stay in lockstep (the release workflow refuses to build if they drift):
//   - package.json                (workspace root)
//   - src-tauri/tauri.conf.json   (desktop app version)
//   - src-tauri/Cargo.toml        ([package] version)
//   - src-tauri/Cargo.lock        (the `nexine` crate entry)
//
// Usage:
//   pnpm bump patch|minor|major        # bump relative to the current version
//   pnpm bump 1.4.0                    # set an explicit version
//   pnpm bump 1.4.0-rc.1               # pre-release
//   pnpm bump patch --no-push          # prepare the commit + tag but don't push
//   pnpm bump patch --dry-run          # show what would change, touch nothing
//
// Pushing the resulting `vX.Y.Z` tag is what triggers .github/workflows/release.yml.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
const dryRun = flags.has('--dry-run');
const noPush = flags.has('--no-push');
const target = positional[0];

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function fail(message) {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
  process.exit(1);
}

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...opts }).trim();
}

if (!target) {
  fail('Usage: pnpm bump <patch|minor|major|X.Y.Z> [--no-push] [--dry-run]');
}

// --- Compute the new version -------------------------------------------------
const rootPkgPath = join(root, 'package.json');
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
const current = rootPkg.version;
const currentMatch = SEMVER.exec(current);
if (!currentMatch) fail(`Current package.json version "${current}" is not valid semver.`);

let next;
if (target === 'patch' || target === 'minor' || target === 'major') {
  const [, majS, minS, patS] = currentMatch;
  const [maj, min, pat] = [Number(majS), Number(minS), Number(patS)];
  if (target === 'major') next = `${maj + 1}.0.0`;
  else if (target === 'minor') next = `${maj}.${min + 1}.0`;
  else next = `${maj}.${min}.${pat + 1}`;
} else if (SEMVER.test(target)) {
  next = target;
} else {
  fail(`Invalid version "${target}". Use patch|minor|major or an explicit X.Y.Z.`);
}

if (next === current) fail(`Version is already ${current}; nothing to bump.`);
const tag = `v${next}`;

// --- Safety checks -----------------------------------------------------------
// Untracked files (e.g. product-plan.md) are fine; a dirty *tracked* tree is not,
// because we're about to create a commit that should contain only version bumps.
const dirtyTracked = git(['status', '--porcelain', '--untracked-files=no']);
if (dirtyTracked && !dryRun) {
  fail(
    'Working tree has uncommitted tracked changes. Commit or stash them before releasing:\n' +
      dirtyTracked,
  );
}

let existingTags = '';
try {
  existingTags = git(['tag', '--list', tag]);
} catch {
  /* not a git repo issues surface elsewhere */
}
if (existingTags === tag) fail(`Tag ${tag} already exists.`);

console.log(`\x1b[36m→ ${current} → ${next}\x1b[0m  (tag ${tag})`);

// --- Rewrite the four version sites ------------------------------------------
/** @type {Array<{ file: string, apply: (s: string) => string }>} */
const edits = [
  {
    file: 'package.json',
    apply: (s) => {
      const json = JSON.parse(s);
      json.version = next;
      return JSON.stringify(json, null, 2) + '\n';
    },
  },
  {
    file: 'src-tauri/tauri.conf.json',
    apply: (s) => {
      const json = JSON.parse(s);
      json.version = next;
      return JSON.stringify(json, null, 2) + '\n';
    },
  },
  {
    file: 'src-tauri/Cargo.toml',
    // Only the [package] version is a bare `version = "..."` at line start;
    // dependency versions are inline (`tauri = { version = "2" }`) and unaffected.
    apply: (s) => {
      let done = false;
      return s.replace(/^version = "[^"]*"$/m, (m) => {
        if (done) return m;
        done = true;
        return `version = "${next}"`;
      });
    },
  },
  {
    file: 'src-tauri/Cargo.lock',
    apply: (s) => s.replace(/(name = "nexine"\nversion = )"[^"]*"/, (_m, p1) => `${p1}"${next}"`),
  },
];

const touched = [];
for (const { file, apply } of edits) {
  const path = join(root, file);
  const before = readFileSync(path, 'utf8');
  const after = apply(before);
  if (after === before) fail(`Could not update version in ${file} (pattern not found).`);
  if (dryRun) {
    console.log(`  would update ${file}`);
  } else {
    writeFileSync(path, after);
    console.log(`  updated ${file}`);
  }
  touched.push(file);
}

if (dryRun) {
  console.log('\x1b[33m(dry run — no files written, no commit, no tag)\x1b[0m');
  process.exit(0);
}

// --- Commit + tag ------------------------------------------------------------
git(['add', ...touched]);
git(['commit', '-m', `chore(release): ${tag}`]);
git(['tag', '-a', tag, '-m', `Nexine ${tag}`]);
console.log(`\x1b[32m✓ committed and tagged ${tag}\x1b[0m`);

if (noPush) {
  console.log(`\nPush when ready to release:\n  git push --follow-tags origin HEAD`);
  process.exit(0);
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
git(['push', '--follow-tags', 'origin', branch], { stdio: 'inherit' });
console.log(`\x1b[32m✓ pushed ${branch} + ${tag} — release workflow will start on GitHub.\x1b[0m`);
