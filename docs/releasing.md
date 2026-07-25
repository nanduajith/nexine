# Releasing

`main` is protected — nobody pushes to it directly. A release is therefore triggered by
**merging a version-bump pull request into `main`**. Bump the version, open the PR, merge it —
GitHub Actions builds and publishes every artifact.

## Cut a release

```bash
pnpm bump patch      # or: minor · major · an explicit 1.4.0 · a prerelease 1.4.0-rc.1
```

[`scripts/bump-version.mjs`](../scripts/bump-version.mjs):

1. Rewrites the version in all four files that carry it, in lockstep — `package.json`,
   `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and the `nexine` entry in
   `src-tauri/Cargo.lock`.
2. Commits the bump on a new `release/vX.Y.Z` branch, pushes it, and opens a PR into `main`.

Then **review and merge the PR**. Merging is what starts the release.

Useful flags: `--dry-run` (show the changes, touch nothing), `--no-pr` (push the branch but don't
open the PR), and `--no-push` (create the branch + commit locally only). The script refuses to run
on a dirty _tracked_ tree or if the `release/vX.Y.Z` branch already exists.

## What the merge does

Every push to `main` runs [`.github/workflows/release.yml`](../.github/workflows/release.yml), but
it only releases when **main's current version has no release yet** — so a bump merge ships a
release while any other merge is a fast no-op (the idempotent `detect` job exits in seconds).

| Job              | Output                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `detect`         | Runs on every push; releases only if `vX.Y.Z` doesn't already exist. Also asserts the four version files agree.   |
| `gate`           | typecheck · lint · test · build · the no-egress CSP guard.                                                        |
| `create-release` | Opens a **draft** GitHub Release and tags the merge commit (`--target $SHA` — no push to `main` needed).          |
| `desktop`        | Tauri installers for macOS (universal), Windows (`.msi`/`.exe`), and Linux (`.deb`/`.rpm`/`.AppImage`).           |
| `web-and-cli`    | The static web bundle (`nexine-web-vX.Y.Z.zip`, built output only) and the CLI tarball (`nexine-cli-vX.Y.Z.tgz`). |
| `docker`         | Pushes `ghcr.io/<owner>/nexine:X.Y.Z` (and `:latest` for stable releases) to the GitHub Container Registry.       |
| `finalize`       | Publishes the release once every artifact has landed.                                                             |

The `gate` job runs the **exact same no-egress CSP check as CI**, so a release can never ship a
build that has lost `connect-src 'none'`.

## Notes

- **No secrets required.** Everything uses the built-in `GITHUB_TOKEN`. Desktop installers are
  **unsigned** for now — users see a Gatekeeper/SmartScreen prompt on first launch. Code signing
  (macOS notarization + Windows Authenticode) can be added later without reworking the pipeline.
- **Prereleases** (a version with a `-` suffix, e.g. `1.4.0-rc.1`) are marked as pre-release and
  do **not** move the Docker `:latest` tag.
- Always cut releases with `pnpm bump` rather than hand-editing versions — the `detect` job fails
  the release if the four version files have drifted.
