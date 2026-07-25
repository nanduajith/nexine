# Cron Explainer — example Nexine plugin

A real, non-trivial plugin that parses a standard 5-field cron expression, explains
each field in plain English, and computes the **actual next run times** — entirely
inside the sandbox, with **zero network access**.

It demonstrates the two host-brokered capabilities:

- **`storage`** — remembers recently explained expressions (namespaced per plugin).
- **`clipboard` (write)** — copies the breakdown or the next-run list.

Network is never requested, so its iframe ships `connect-src 'none'` and the tool
physically cannot exfiltrate.

## Layout

```
cron-explainer/
  manifest.json     # id, permissions (storage + clipboard:write), metadata
  src/index.ts      # the plugin: cron parser, English describer, next-run engine, UI
```

The entry registers itself via the injected `nexine.definePlugin(...)` global (a
classic script inside the sandbox — no ESM/eval). Types come from
`@nexine/sdk/guest`; `import type` is erased at bundle time, so the shipped bundle
is fully self-contained.

## Build, sign, and side-load

Build the `nexine` CLI once, then drive it with the `pnpm nexine` script (a thin
wrapper over the bundled `packages/cli/dist/bin.js`):

```bash
# 0. Build the CLI binary (once, from the repo root)
pnpm build:cli

# 1. Generate a signing keypair (once)
pnpm nexine keygen --label "Nexine Examples"

# 2. Bundle + sign into a .nexpkg
pnpm nexine pack examples/cron-explainer --key nexine.key.json

# 3. Inspect / verify the package
pnpm nexine verify dev.nexine.cron-explainer-1.0.0.nexpkg --trust nexine.pub.json
```

Once packaged for distribution the same binary runs as a plain `nexine` command;
here in the monorepo `pnpm nexine …` (or `node packages/cli/dist/bin.js …`) is the
entry point.

Then open the host app → **Side-load plugin** → choose the `.nexpkg` (or paste it),
review the signature and permissions, optionally pin the publisher, and install.
The plugin then runs in its own opaque-origin, CSP-locked sandbox.

## What "meaningful work" looks like here

- Full cron grammar: `*`, `*/n`, `a-b`, `a-b/n`, `a,b,c`, and month/weekday names
  (`JAN`, `MON-FRI`), with range/step validation and clear error messages.
- Correct **Vixie-cron day-of-month / day-of-week OR rule** when both are restricted.
- Next-run computation by walking the schedule minute-by-minute, and honest
  handling of impossible schedules (e.g. `0 0 30 2 *` → never fires).
