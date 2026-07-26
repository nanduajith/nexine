# Architecture

Nexine is a **pnpm workspace monorepo** with strict, one-directional dependencies. The domain
core knows nothing about React; the UI knows nothing about the host; the host composes
everything.

## Package graph

```
        @nexine/core ────────────────┐  (framework-free domain: ToolMeta, registry,
             ▲          ▲             │   search, CSP builder — no React, ever)
             │          │             │
      @nexine/sdk   @nexine/ui        │  (sdk: public plugin contract — manifest,
        ▲    ▲          ▲             │   permissions, dataFlows, validate)
        │    │          │             │  (ui: React design system + ToolModule contract)
        │    │          │             │
 @nexine/plugin-runtime │             │  (desktop-only sandbox: permission-engine, per-plugin CSP,
        ▲    ▲          │             │   rpc-host broker, loadPlugin / loadPackage)
        │    │          │             │
 @nexine/packaging      │             │  (desktop-only signed .nexpkg: Ed25519 WebCrypto, TrustStore)
        ▲    ▲          │             │
        │    │          │             │
   @nexine/cli    @nexine/host ◀───────┘  (cli: keygen/pack/verify/inspect — Node)
                       ▲                    (host: THE APP — shell, routing, storage,
                       │                     adapter seam, Settings/governance UI)
              tools/*  │  examples/*         (tools/*: pure transforms, reused by host tools)
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
│   │   └── src/guest/     #   desktop-only: guest bootstrap + definePlugin
│   ├── ui/                # React design system: tokens, primitives, ToolModule
│   ├── plugin-runtime/    # desktop-only: permission-engine, plugin-csp, rpc-host, sandbox
│   ├── packaging/         # desktop-only: canonical JSON, Ed25519 WebCrypto, .nexpkg, TrustStore
│   ├── cli/               # the `nexine` binary (bundled to dist/bin.js via esbuild)
│   └── host/              # the application
│       └── src/
│           ├── app/           # App.tsx, hooks (useTools, useGovernance, useAudit, useHashRoute)
│           ├── features/      # command-palette, shell, theme
│           │   ├── tools/     #   first-party in-process tools (Web & Desktop)
│           │   └── plugins/   #   desktop-only: sandboxed plugins, Settings panels, PluginRunView
│           ├── infrastructure/
│           │   ├── platform/  #   plugin-adapter (seam between web/desktop), Tauri integrations
│           │   └── storage/   #   reactive localStorage stores (governance, preferences, audit)
│           └── lib/
├── tools/*/               # one package per tool: a pure transform.ts (+ transform.test.ts)
├── examples/*/            # sample plugins you can pack, sign, and side-load
├── src-tauri/             # Tauri v2 desktop shell (Rust)
├── deploy/                # Dockerfile + nginx.conf (self-host)
└── docs/                  # this documentation
```

## Two-tier architecture

Nexine has **two execution tiers** built from one codebase, separated by an adapter seam.

|                         | Web Tier                                  | Desktop Tier                          |
| ----------------------- | ----------------------------------------- | ------------------------------------- |
| **First-party tools**   | Render in-process (native DOM)            | Render in-process (native DOM)        |
| **Third-party plugins** | Not supported                             | Governed sandbox (iframe)             |
| **Bundle contents**     | Shell + first-party tools only            | Shell + first-party + plugin runtime  |
| **Attack surface**      | Zero (no plugin code, no iframe, no eval) | Low (isolated per-plugin CSP, signed) |
| **App CSP**             | `connect-src 'none'` (Zero egress)        | `connect-src 'none'` (Zero egress)    |

### The Adapter Seam

To guarantee the web tier carries zero plugin attack surface, third-party plugin support is abstracted behind a `PluginAdapter` interface (`plugin-adapter.types.ts`).

- `plugin-adapter.web.ts` is a stub that returns no installed plugins and mounts no settings panels.
- `plugin-adapter.desktop.ts` imports `@nexine/plugin-runtime`, `@nexine/packaging`, and all the sandbox UI machinery, implementing the full side-loading and execution flow.

At build time in `packages/host/vite.config.ts`, an alias swap explicitly points `@adapter` to either the web or desktop implementation. Because the desktop adapter is the _only_ file in the host that imports the plugin machinery, when Vite builds the web tier, the entire runtime, packaging module, guest API, and sandbox UI are structurally unreachable and omitted from the bundle.

### How a sandboxed plugin runs (Desktop only)

1. **Verify**: The host verifies the `.nexpkg` Ed25519 signature and resolves the signer against the Trust Store.
2. **Resolve**: The manifest's requested permissions are resolved against the user's active Governance Policy.
3. **Sandbox**: A Tauri custom protocol (`nexine-sandbox://`) serves the plugin guest runtime (`plugin-guest.js`) and the sandbox document (`sandbox.html`) with a dynamic `Content-Security-Policy` header explicitly built for this plugin (e.g., granting `connect-src https://api.example.com` if allowed).
4. **Boot**: The host passes the plugin source code, manifest, and granted capabilities over a `MessageChannel` (`nx:port`). The guest runs the source as a `blob:` script (never markup).
5. **Run**: The plugin renders plain DOM inside the iframe and reaches host capabilities (storage, clipboard) only through the permission-checked RPC bridge.

Two additive, capability-free `postMessage` bridges exist between host and sandbox — a **theme bridge** (host pushes the active theme) and **auto-height** (the guest reports its content height). Neither touches the network or a permission.

## State & persistence

The app has no backend. All persistence is three reactive `localStorage` stores
(`useSyncExternalStore` pattern — subscribe / getSnapshot / commit):

| Key                     | Holds                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `nexine.governance.v1`  | policy, per-plugin+version consents, publisher trust, **installed packages** |
| `nexine.preferences.v1` | theme, favorites, recently-used tool ids (never inputs)                      |
| `nexine.audit.v1`       | the governance activity log (metadata only, capped ring buffer)              |

On desktop (Tauri) the webview's `localStorage` is persisted for you, so the same code path
covers web and desktop. See [governance.md](governance.md) for what each store records.

## Testing & quality gates

```bash
pnpm typecheck   # tsc across the workspace (project references)
pnpm lint        # eslint (enforces import boundaries: no React in core, etc.)
pnpm test        # vitest — pure transform tests, CSP test, signing round-trip, permission engine
pnpm build       # production build; the CSP test asserts connect-src 'none' + no unsafe-eval
```
