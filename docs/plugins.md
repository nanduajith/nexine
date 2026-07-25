# Writing a Nexine plugin

A plugin is a self-contained developer tool that runs inside Nexine's sandbox. It is authored
in TypeScript, bundled to a single classic-script module, and distributed as a **signed
`.nexpkg` package**. At runtime it lives in an opaque-origin iframe and can do nothing
privileged unless it declares — and is granted — a permission.

This guide walks through the manifest, the guest SDK, packaging + signing with the `nexine`
CLI, and side-loading. A complete, working reference is
[`examples/cron-explainer`](../examples/cron-explainer).

## Anatomy of a plugin package

A plugin source directory contains two things:

```
my-plugin/
├── manifest.json     # declarative metadata + requested permissions (no code)
└── src/plugin.ts     # the entry that calls nexine.definePlugin(...)
```

`nexine pack` bundles the entry and pairs it with the manifest to produce a **`.nexpkg`** —
a single JSON document:

```jsonc
{
  "format": 1,
  "manifest": {/* your manifest.json, validated */},
  "code": "…", // the bundled entry, as a self-contained IIFE string
  "signature": {
    // detached Ed25519 signature over a canonical envelope
    "algorithm": "ed25519",
    "keyId": "…",
    "publicKey": "…",
    "value": "…",
  },
}
```

## 1. The manifest

The manifest is the **security-load-bearing** artifact: the host reads and validates it
_before any plugin code runs_, and its declared permissions determine the CSP the plugin's
iframe is created with. Because the declaration precedes and constrains the code, a plugin
cannot grant itself a capability at runtime.

```jsonc
{
  "manifestVersion": 1, // must be 1; the host rejects unknown versions
  "id": "dev.acme.csv", // globally unique, stable (reverse-DNS or kebab-case)
  "name": "CSV Toolkit",
  "version": "1.0.0", // semver; a version bump invalidates prior consent
  "description": "Convert and inspect CSV — offline.",
  "category": "data", // one of the shared tool categories (see below)
  "author": "Acme Corp", // optional publisher label
  "icon": "Table", // optional; resolved from the host icon registry
  "keywords": ["csv", "tsv"], // optional extra search terms
  "sensitive": false, // optional; true keeps history/telemetry off by default
  "permissions": [], // deny-by-default — see below
  "entry": "plugin.js", // relative path to the bundled entry (set by pack)
}
```

**Categories** are a small, shared vocabulary (so plugins slot in beside builtins):
`encoding · crypto · web · data · text · generators · time`. A plugin lands in the sidebar and
command palette under its category, interleaved with every other tool — there is no separate
"plugins" section.

### Permissions (deny by default)

Omitting `permissions` (or an empty array) means a fully sandboxed, **zero-egress** tool — the
safest and most common case. Three capabilities can be requested, each scoped as narrowly as
possible:

```jsonc
// Network — the ONLY way to reach the network. Hosts become the iframe's CSP connect-src.
{ "id": "network", "hosts": ["https://api.example.com"] }

// Clipboard — split so you can ask for write without gaining read.
{ "id": "clipboard", "access": "write" }        // "read" | "write" | "readwrite"

// Storage — persistent, per-plugin key/value. Namespaced; plugins can't read each other's.
{ "id": "storage", "maxBytes": 65536 }          // maxBytes is a hint; the host enforces a ceiling
```

### Data-flow declarations (required with `network`)

If you request `network`, you must also declare **what leaves and to where**, in plain
language. Permissions say what the browser will technically allow; `dataFlows` say what you
_intend_ — both are shown side by side at install-time consent, and validation rejects a
declared destination that has no matching network host.

```jsonc
"dataFlows": [
  { "destination": "api.example.com", "description": "Sends the pasted CSV for schema inference.", "optional": false }
]
```

Nexine never inspects payloads at runtime (that would defeat the no-egress promise). Data-flows
are a **transparency contract**, enforced socially by review and technically by the network
allowlist.

## 2. The entry (guest SDK)

The entry imports types from `@nexine/sdk/guest` for authoring DX (they are erased at bundle
time) and registers the plugin through the injected `nexine.definePlugin` global. Everything is
UI-framework-agnostic: `mount` receives a plain DOM element.

```ts
import type { PluginContext, PluginDefinition } from '@nexine/sdk/guest';

declare const nexine: { definePlugin(def: PluginDefinition): void };

nexine.definePlugin({
  setup(ctx: PluginContext) {
    // ctx.manifest    — your validated manifest
    // ctx.permissions — the permissions actually GRANTED (may be narrower than requested)
    // ctx.host        — the permission-checked bridge: { storage, clipboard }
    return {
      async mount(root: HTMLElement) {
        const input = document.createElement('textarea');
        const out = document.createElement('pre');
        const copy = document.createElement('button');
        copy.textContent = 'Copy';

        input.addEventListener('input', () => {
          out.textContent = transform(input.value);
        });
        copy.addEventListener('click', () => {
          // Only works if you declared clipboard:write and it was granted.
          void ctx.host.clipboard.writeText(out.textContent ?? '');
        });

        root.append(input, out, copy);
      },
      unmount() {
        // optional cleanup
      },
    };
  },
});
```

### The host bridge

Capabilities are reached only through `ctx.host`, over a private `MessageChannel`. Calls to a
capability you were **not** granted reject with `PermissionDeniedError` — they are unreachable,
not merely discouraged.

```ts
// Storage (if granted) — persistent, namespaced to your plugin id.
await ctx.host.storage.set('recent', JSON.stringify(items));
const raw = await ctx.host.storage.get('recent');

// Clipboard (if granted).
await ctx.host.clipboard.writeText(result);
const pasted = await ctx.host.clipboard.readText(); // needs clipboard:read
```

> Network is not a bridge method: if you declared `network` hosts, use the platform `fetch`
> directly — the iframe's CSP `connect-src` already limits you to exactly those origins. With
> no `network` grant, `fetch` is physically blocked by the browser.

## 3. Package & sign with the CLI

Build the CLI once, generate a signing keypair, then pack. Everything runs locally — no
network, no account.

```bash
# Build the `nexine` binary (dist/bin.js)
pnpm build:cli

# Generate an Ed25519 keypair. Writes nexine.key.json (SECRET) + nexine.pub.json (shareable).
pnpm nexine keygen --label "Acme Corp"

# Bundle + sign your plugin into a .nexpkg
pnpm nexine pack ./my-plugin --key nexine.key.json

# Inspect / verify a package (verify accepts trusted public keys)
pnpm nexine inspect my-plugin-1.0.0.nexpkg
pnpm nexine verify  my-plugin-1.0.0.nexpkg --trust nexine.pub.json
```

CLI commands:

| Command                                                                    | Purpose                                 |
| -------------------------------------------------------------------------- | --------------------------------------- |
| `keygen [--out <dir>] [--label <name>] [--force]`                          | generate an Ed25519 signing keypair     |
| `pack <dir> --key <keyfile> [--entry <path>] [--out <file>] [--no-minify]` | bundle + sign a plugin into a `.nexpkg` |
| `verify <package> [--trust <pubkey.json> …]`                               | verify a package's signature and trust  |
| `inspect <package>`                                                        | show a verified package's declarations  |

> **Keep `nexine.key.json` secret.** It is your private signing key; anyone with it can sign
> packages as you. It is git-ignored by default — never commit it. Share only the `*.pub.json`.

The signature covers a **canonical envelope** binding the public key and key id, so a package
cannot be re-signed under a substituted key. `verify` is a hard gate on integrity/authenticity,
but reports _trust_ (whether the signer is pinned) separately — trust is the host's decision,
never implied by a valid signature.

## 4. Side-load into the app

In the running app, open **Settings → Plugins**:

1. **Choose `.nexpkg` file** (or paste the package JSON).
2. Nexine verifies the Ed25519 signature locally and shows the signer, trust status, and the
   exact permissions requested.
3. **Allow & install.** The package is stored in `localStorage` and its signature is
   re-verified on every run.

The installed plugin then appears in the sidebar under its category, alongside builtins, and
runs from there in its own sandbox — Settings only manages plugins, it never runs them.

See [governance.md](governance.md) for consent, publisher trust, policy modes, and the audit
log, and [security-model.md](security-model.md) for exactly how the sandbox contains a plugin.
