# Nexine Security Model

Nexine's core promise is simple: **your data never leaves your machine.** This document
describes how that guarantee is enforced, how to verify it independently, and — honestly — the
boundaries of what it covers.

## The guarantee: no egress

Every tool runs **entirely client-side**. There is no application server, no account, and no
telemetry. The production build ships a strict Content-Security-Policy whose key directive is:

```
connect-src 'none'
```

This means the application **cannot open a network connection of any kind** — `fetch`, `XMLHttpRequest`,
`WebSocket`, `EventSource`, and `navigator.sendBeacon` are all blocked by the browser. There is no
code path by which a pasted secret, token, or payload can be exfiltrated, because the runtime itself
forbids outbound connections.

**Scope of this guarantee.** The absolute claim above is the _app document's_, and it is permanent.
Every first-party tool is denied the network too — they run in-process and request no network permission, so
each runs under the app's `connect-src 'none'`. On desktop, third-party plugins run in their own sandboxes and are likewise
denied the network by default; where a plugin _is_ granted egress, it is a **scoped, declared,
admin-controlled** permission bounded to exact hosts (see [Desktop plugin sandbox](#desktop-plugin-sandbox) and
[Governance & audit](#governance--audit)). Granting a plugin scoped egress never loosens the app
document's own `connect-src 'none'` — the host is never a network proxy.

## How it is enforced

1. **Single source of truth.** The policy is produced by
   [`buildContentSecurityPolicy`](../packages/core/src/security/csp.ts) in the framework-free core.
2. **Injected at build time.** A Vite plugin writes the policy into a `<meta http-equiv>` tag in
   `index.html`. Development relaxes _only_ the localhost WebSocket that HMR needs; that relaxation
   never ships.
3. **Defense in depth when self-hosted.** The provided [`nginx.conf`](../deploy/nginx.conf) also sends
   the policy as a real HTTP header (which additionally enforces `frame-ancestors`).
4. **No third-party origins.** Fonts are self-hosted via `@fontsource` and bundled into the build —
   there is no Google Fonts (or any) CDN. There are no analytics or error-reporting SDKs.
5. **Vetted crypto only.** Cryptographic operations use the platform WebCrypto API (and, where
   needed, audited libraries such as `jose`). Nexine never ships hand-rolled cryptographic
   primitives. Identifiers use `crypto.getRandomValues` / `crypto.randomUUID`, never `Math.random`.

## How to verify it yourself

- **Automated:** `pnpm test` runs [`csp.test.ts`](../packages/core/src/security/csp.test.ts), which
  asserts the production policy contains `connect-src 'none'` and never `unsafe-eval`.
- **In the browser:** open DevTools → Network while using the app. You will see requests only to the
  origin serving the app (or `localhost` in dev) — never to any external host.
- **In the bundle:** `pnpm build`, then inspect `packages/host/dist/index.html` for the CSP meta tag
  and grep `dist/` for external URLs. The only matches are inert strings in React's error messages,
  which the CSP would block regardless.

## Handling of sensitive input

- Tools that routinely process secrets (e.g. the JWT decoder) are flagged `sensitive: true`. For
  these, **input is never persisted** — not to history, not to storage.
- Local preferences (favorites, recently-used tool ids, theme) are stored in `localStorage` on the
  device only. They contain tool identifiers and UI settings — never tool inputs or outputs.

## Desktop plugin sandbox

On desktop, third-party plugins run in a sandboxed iframe; first-party tools render in-process on both web and desktop. Untrusted code is isolated by construction rather than by trust:

1. **Opaque-origin iframe over a real sandbox document.** Each plugin runs in a
   `sandbox="allow-scripts"` iframe with **no** `allow-same-origin`, so it executes at an opaque
   origin. It cannot read the host's DOM, cookies, `localStorage`, or preferences — proven by the
   sandbox self-test. The iframe is pointed at a real **`nexine-sandbox://`** custom-protocol document — deliberately _not_ a `srcdoc`/`blob:`/`data:`
   document. A real-scheme document is governed **only by its own CSP**, so the sandbox is both fully
   isolated _and_ actually runnable.
2. **The sandbox document enforces per-plugin CSP.** The `nexine-sandbox` protocol serves the sandbox document with a dynamic `Content-Security-Policy` header. By default, it denies all network egress (`connect-src 'none'`). The host-trusted
   guest loads as a same-origin (`'self'`) script; the untrusted plugin source is handed over the
   private channel and executed as an in-memory `blob:` script.
3. **Deny-by-default permissions.** A plugin declares permissions in a manifest that is validated
   _before any code runs_ ([`validateManifest`](../packages/sdk/src/validate.ts)). The
   [permission engine](../packages/plugin-runtime/src/permission-engine.ts) resolves declared vs.
   policy into a granted set (with governance modes `allow → blocklist → lockdown`, permission
   ceilings, and network-host narrowing). Capabilities not granted are unreachable.
4. **Brokered capabilities.** Storage and clipboard are reached only through a permission-checked RPC
   broker ([`rpc-host`](../packages/plugin-runtime/src/rpc-host.ts)) over a private `MessageChannel`.
   Storage is namespaced per plugin, so one plugin can never read another's data.

The one app-level policy concession this requires is `frame-src 'self'` (down from `'none'`), which
only lets the desktop host _create_ the sandboxes; each sandbox then enforces its own stricter policy. The
app's own `connect-src 'none'` and `script-src 'self'` are unchanged.

> **On scoped plugin egress.** The permission vocabulary and governance UI model a _declared,
> admin-granted_ `network` capability with an exact host allow-list. The permission engine narrows it against policy, and the Tauri custom protocol serves the `nexine-sandbox://` document with a **per-plugin** `connect-src` header enforcing that exact allow-list. By default, every plugin gets `connect-src 'none'`.

## Signed side-loading

Plugins that don't ship with the app are distributed as **signed `.nexpkg` packages**. The
[`@nexine/packaging`](../packages/packaging) layer signs a canonical envelope with **Ed25519 via
WebCrypto**; the signature binds the public key and key id, so a package cannot be re-signed
under a substituted key. On install _and on every subsequent mount_, the host re-verifies the
signature before any code runs (`loadPackage`). Verification is a hard gate on
integrity/authenticity; **trust** (whether the signer is pinned) is reported separately and is
always the host's decision. Packages are built and signed locally with the
[`nexine` CLI](../packages/cli) — no network, no account. See [plugins.md](plugins.md).

## Governance & audit

The free, on-device governance tier — install-time consent, publisher trust, graduated policy
modes (`allow → blocklist → lockdown`), **egress control** (deny-by-default network with global and
per-plugin host allow-lists), a shareable policy file, and a metadata-only audit log — is described
in [governance.md](governance.md). The audit log records governance _decisions_ only (including each
granted egress host); it never records plugin inputs, outputs, or payloads.

## Honest scope / non-goals

- Enforcement relies on the browser honoring CSP. Nexine does not defend against a compromised
  browser, OS, or malicious extensions already running on the machine.
- The clipboard is used for copy actions; that is a local, user-initiated operation.
- Plugin **data-flow declarations** are a transparency contract shown at install-time consent, not a
  runtime payload inspection (which would defeat the no-egress promise for everyone). What a plugin
  can technically reach is bounded by its CSP; what it _claims_ to send is bounded by review.
- The hosted **marketplace** and **fleet-scale** (managed, unbypassable) governance distribution are
  **Phase 3** and not yet implemented. Package signing, side-loading, and the local/DIY governance
  tier _are_ implemented. See [`product-plan.md`](../product-plan.md).
