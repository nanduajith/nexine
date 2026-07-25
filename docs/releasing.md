# Releasing

Nexine ships from **one command and one tag**. A version bump is the entire release trigger:
you bump the version, the tag is pushed, and GitHub Actions builds and publishes every artifact.

## Cut a release

```bash
pnpm bump patch      # or: minor · major · an explicit 1.4.0 · a prerelease 1.4.0-rc.1
```

[`scripts/bump-version.mjs`](../scripts/bump-version.mjs) does the whole bump atomically:

1. Rewrites the version in all four files that carry it, in lockstep — `package.json`,
   `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and the `nexine` entry in
   `src-tauri/Cargo.lock`.
2. Commits `chore(release): vX.Y.Z` and creates an annotated `vX.Y.Z` tag.
3. Pushes the branch **and** the tag. The tag push is what starts the release.

Useful flags: `--dry-run` (show the changes, touch nothing) and `--no-push` (commit and tag
locally, push yourself later). The script refuses to run on a dirty _tracked_ tree or if the
tag already exists.

## What the workflow does

Pushing a `v*.*.*` tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Job              | Output                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `gate`           | Asserts the tag version matches all version files, then runs typecheck · lint · test · build · the CSP guard.     |
| `create-release` | Opens a **draft** GitHub Release with auto-generated notes.                                                       |
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
- If the workflow reports a version mismatch, the tag and the version files drifted — always cut
  releases with `pnpm bump` rather than tagging by hand.
