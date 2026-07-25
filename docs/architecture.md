# Architecture

Nexine is a **pnpm workspace monorepo** with strict, one-directional dependencies. The domain
core knows nothing about React; the UI knows nothing about the host; the host composes
everything. This keeps the security-load-bearing pieces (the CSP builder, the manifest
validator, the permission engine) small, pure, and independently testable.

## Package graph

```
        @nexine/core ────────────────┐  (framework-free domain: ToolMeta, registry,
             ▲          ▲             │   search, CSP builder — no React, ever)
             │          │             │
      @nexine/sdk   @nexine/ui        │  (sdk: public plugin contract — manifest,
        ▲    ▲          ▲             │   permissions, dataFlows, validate, RPC, guest API)
        │    │          │             │  (ui: React design system + ToolModule contract)
        │    │          │             │
 @nexine/plugin-runtime │             │  (the sandbox: permission-engine, per-plugin CSP,
        ▲    ▲          │             │   rpc-host broker, loadPlugin / loadPackage)
        │    │          │             │
 @nexine/packaging      │             │  (signed .nexpkg: Ed25519 sign/verify, TrustStore)
        ▲    ▲          │             │
        │    │          │             │
   @nexine/cli    @nexine/host ◀───────┘  (cli: keygen/pack/verify/inspect — Node)
                       ▲                    (host: THE APP — shell, routing, storage,
                       │                     sandbox host, Settings/governance UI)
              tools/*  │  examples/*         (tools/*: pure transforms, reused by builtins)
                                             (examples/*: sample side-loadable plugins)
```

Dependencies only ever point **up** toward `core`. ESLint enforces that `core` never imports a
UI or framework module.

## Directory layout

```
nexine/
├── packages/
│   ├── core/              # ToolMeta, tool registry, search, categories, security/csp.ts
│   ├── sdk/               # public plugin contract
│   │   └── src/guest/     #   guest bootstrap + definePlugin (stringified into the iframe)
│   ├── ui/                # React design system: tokens, primitives, ToolModule
│   ├── plugin-runtime/    # permission-engine, plugin-csp, rpc-host, sandbox, loadPlugin/loadPackage
│   ├── packaging/         # canonical JSON, Ed25519 WebCrypto, .nexpkg, TrustStore
│   ├── cli/               # the `nexine` binary (bundled to dist/bin.js via esbuild)
│   └── host/              # the application
│       └── src/
│           ├── app/           # App.tsx, hooks (useTools, useGovernance, useAudit, useHashRoute)
│           ├── builtins/      # builtin plugin SOURCES: <id>/{manifest.json,entry.ts}
│           │   ├── _kit/          #   shared vanilla-DOM UI kit bundled into each builtin
│           │   └── vite-builtins.ts  # build-time: esbuild each entry → self-contained IIFE
│           ├── features/      # command-palette, plugins (Settings, PluginRunView), shell, theme
│           ├── infrastructure/
│           │   ├── platform/      # Tauri desktop integration (global hotkey, keychain)
│           │   └── storage/       # reactive localStorage stores (governance, preferences, audit)
│           └── lib/
├── tools/*/               # one package per tool: a pure transform.ts (+ transform.test.ts)
├── examples/*/            # sample plugins you can pack, sign, and side-load
├── src-tauri/             # Tauri v2 desktop shell (Rust)
├── deploy/                # Dockerfile + nginx.conf (self-host)
└── docs/                  # this documentation
```

## Everything is a sandboxed plugin

Nexine has **one execution path** for tools. There is no privileged in-process path — even
the first-party "builtin" tools run in the exact same opaque-origin, CSP-locked iframe as an
untrusted side-loaded plugin. The only difference is where the source comes from.

|           | Builtins                                                                        | Installed (side-loaded) plugins                                    |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Source    | `packages/host/src/builtins/<id>/` in the repo                                  | a signed `.nexpkg` file                                            |
| Bundled   | at build time by `vite-builtins.ts` (esbuild → IIFE string embedded in the app) | ahead of time by `nexine pack` (esbuild → IIFE inside the package) |
| Stored    | in the app bundle                                                               | in `localStorage` (`nexine.governance.v1 → installed`)             |
| Signature | none (they are the app)                                                         | Ed25519, re-verified on every mount                                |
| Runs via  | `loadPlugin`                                                                    | `loadPackage` (verify → `loadPlugin`)                              |
| Consent   | shown on first open                                                             | shown on first open                                                |

This means the SDK and sandbox are **dogfooded** by the app itself, and the no-egress story
holds even for first-party code: a builtin is as physically incapable of exfiltration as any
third-party plugin.

### How a tool is built and run

1. **Author** a typed TS entry (`entry.ts`) that imports a pure transform from `tools/*` and
   calls the injected `nexine.definePlugin({ setup(ctx) { return { mount(root) {…} } } })`.
2. **Bundle** it to a self-contained classic-script IIFE (esbuild, `format: 'iife'`,
   `bundle: true`). For builtins this happens at app-build time via the virtual module
   `virtual:nexine-builtins`; for plugins it happens in `nexine pack`.
3. **Load** it: `loadPlugin` validates the manifest, resolves permissions against policy,
   computes the per-plugin CSP, creates the `sandbox="allow-scripts"` iframe, injects the
   bootstrap + code under a nonce, and wires a `MessageChannel` RPC.
4. **Run**: inside `mount`, the plugin builds plain DOM and reaches host capabilities
   (storage, clipboard) only through the permission-checked RPC bridge.

Two additive, capability-free `postMessage` bridges exist between host and sandbox — a **theme
bridge** (host pushes the active theme) and **auto-height** (the guest reports its content
height). Neither touches the network or a permission, so `connect-src 'none'` is untouched.

## State & persistence

The app has no backend. All persistence is three reactive `localStorage` stores
(`useSyncExternalStore` pattern — subscribe / getSnapshot / commit):

| Key                     | Holds                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `nexine.governance.v1`  | policy, per-plugin+version consents, publisher trust, **installed packages**, removed builtins |
| `nexine.preferences.v1` | theme, favorites, recently-used tool ids (never inputs)                                        |
| `nexine.audit.v1`       | the governance activity log (metadata only, capped ring buffer)                                |

On desktop (Tauri) the webview's `localStorage` is persisted for you, so the same code path
covers web and desktop. See [governance.md](governance.md) for what each store records.

## Testing & quality gates

```bash
pnpm typecheck   # tsc across the workspace (project references)
pnpm lint        # eslint (enforces import boundaries: no React in core, etc.)
pnpm test        # vitest — pure transform tests, CSP test, signing round-trip, permission engine
pnpm build       # production build; the CSP test asserts connect-src 'none' + no unsafe-eval
```
