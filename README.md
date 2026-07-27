# Nexine

**An offline-first, no-egress developer toolbox that grows into a governed plugin platform.**
Nothing leaves your machine unless you explicitly allow it.

<!-- prettier-ignore-start -->
[![CI](https://github.com/nanduajith/nexine/actions/workflows/ci.yml/badge.svg)](https://github.com/nanduajith/nexine/actions/workflows/ci.yml)
[![Release](https://github.com/nanduajith/nexine/actions/workflows/release.yml/badge.svg)](https://github.com/nanduajith/nexine/actions/workflows/release.yml)
[![Tests](https://img.shields.io/badge/tests-160%20passing-2ea44f)](https://github.com/nanduajith/nexine/actions/workflows/ci.yml)
[![Coverage](https://nanduajith.github.io/nexine/coverage.svg)](https://github.com/nanduajith/nexine/actions)
[![Egress](https://img.shields.io/badge/network%20egress-deny--by--default-2ea44f)](docs/security-model.md)
[![Platform](https://img.shields.io/badge/platform-desktop%20%7C%20web-6366f1)](#desktop-app-tauri)
[![License: MIT](https://img.shields.io/badge/license-MIT-8b5cf6)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-site-8b5cf6)](https://nanduajith.github.io/nexine/)
<!-- prettier-ignore-end -->

📖 **Full documentation & live walkthrough:** **[nanduajith.github.io/nexine](https://nanduajith.github.io/nexine/)**

Nexine is a cross-platform (desktop + self-hostable web) collection of everyday developer
utilities — JWT, Base64, URL, hashing, JSON, and more. Nexine uses a **two-tier architecture** designed to give you instant access on the web, while reserving powerful, sandboxed third-party plugins for the native desktop app.

> _Nexine_ — after the **nexine**, the inner protective layer of a pollen-grain wall: a hardened
> shell that keeps what's inside safe.

---

## Web vs. Desktop: Which do I need?

Nexine ships in two forms. The **web version** is a lightweight, instant-access toolbox. The **desktop app** is the full plugin platform.

| Capability                                        | Web (Lightweight) | Desktop App |
| :------------------------------------------------ | :---------------: | :---------: |
| **First-party tools** (JWT, JSON, Hash, +50 more) |      ✅ Yes       |   ✅ Yes    |
| **100% Client-side processing** (No egress)       |      ✅ Yes       |   ✅ Yes    |
| **Global summon hotkey** (⌘⇧Space)                |       ❌ No       |   ✅ Yes    |
| **Third-party Plugins** (.nexpkg side-loading)    |       ❌ No       |   ✅ Yes    |
| **Plugin isolation** (Opaque-origin iframe)       |        N/A        |   ✅ Yes    |
| **Governance & Egress control** (Policy rules)    |        N/A        |   ✅ Yes    |
| **OS Keychain-backed secret storage**             |       ❌ No       |   ✅ Yes    |
| **Local Filesystem Access** (via plugins)         |       ❌ No       |   ✅ Yes    |

**Use the Web App if** you just need to quickly decode a JWT, format JSON, or use one of the 50+ built-in utilities without installing anything. It is instantaneous and works on any device.

**Download the Desktop App if** you want to install third-party plugins, write your own extensions that access your local filesystem, govern team plugin usage, or use the global hotkey to summon Nexine instantly over any window.

---

## 💡 How Nexine Compares

Almost every developer utility suite today claims to be "client-side only". However, the moment you need to extend those tools with custom logic, that privacy guarantee shatters.

Nexine isn't trying to be the only tool you use—it's trying to solve a specific enterprise problem: **maintaining a strict "no-egress" privacy guarantee even when executing untrusted third-party plugins.** Built with a security-first architecture, Nexine provides instant accessibility on the web and governed extensibility on the desktop.

| Feature / Philosophy       | Nexine                                                                       | IT-Tools                                     | DevToys                          | CyberChef                                       |
| :------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------- | :------------------------------- | :---------------------------------------------- |
| **Architecture**           | Web PWA + Tauri Desktop                                                      | Web PWA                                      | Native (.NET / Blazor)           | Web PWA                                         |
| **Data Privacy Guarantee** | **100% Local Processing**                                                    | 100% Local Processing                        | 100% Local Processing            | 100% Local Processing                           |
| **Plugin Extensibility**   | **Yes** (Sandboxed `.nexpkg` plugins)                                        | No (Requires forking)                        | **Yes** (NuGet / C#)             | No (Requires forking)                           |
| **Plugin Security Model**  | **Strict Governance** (Per-plugin CSP, zero-eval, explicit egress whitelist) | N/A                                          | **Full OS Access** (Local Trust) | N/A                                             |
| **Desktop / Native Mode**  | Yes                                                                          | No                                           | Yes                              | No                                              |
| **Primary Target**         | Enterprise teams requiring secure, governed extensibility                    | Individual developers needing standard tools | Native desktop power users       | Cybersecurity analysts / complex data pipelines |

#### 🆚 Nexine vs. IT-Tools

[IT-Tools](https://it-tools.tech/) is a phenomenal, open-source web monolith packed with over 80 utilities out of the box. Both IT-Tools and Nexine guarantee that your data never leaves your browser.

- **Choose IT-Tools if** you are an individual developer who wants a massive, ready-to-use library of standard web tools and have no need to write custom internal utilities.
- **Choose Nexine if** you are on a team that needs to build proprietary, internal utilities (e.g., a custom auth token generator for your staging environment) and distribute them securely without forking an entire monolith.

#### 🆚 Nexine vs. DevToys

[DevToys](https://devtoys.app/) is a heavyweight "Swiss Army knife" built natively on .NET, offering extensions via C# NuGet packages.

- **Choose DevToys if** you prefer a deeply integrated native Windows/Mac application and are comfortable running third-party C# plugins with full local OS trust (meaning plugins can silently read your filesystem or make network requests).
- **Choose Nexine if** you want the security-first peace of mind. Nexine's desktop environment executes all third-party plugins inside a highly restricted, zero-eval sandbox. A plugin cannot exfiltrate your clipboard data to the internet unless you, the administrator, explicitly write an egress policy allowing it.

#### 🆚 Nexine vs. CyberChef

[CyberChef](https://gchq.github.io/CyberChef/) by GCHQ is the undisputed king of data manipulation, built around a multi-stage "recipe" pipeline.

- **Choose CyberChef if** you are performing complex, multi-step data transformations, malware analysis, chained encryptions, or deep packet decoding.
- **Choose Nexine if** your daily tasks are standard, one-off developer operations (like formatting JSON or decoding a JWT) where a heavy pipeline UI introduces unnecessary friction.

---

## The guarantee: no egress

Everything runs **100% client-side**. The production build ships a strict Content-Security-Policy
with `connect-src 'none'` — the application literally **cannot open a network connection**.
`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `sendBeacon` are all blocked by the
browser. Fonts are self-hosted (no CDN), there is no account, and there is no telemetry. This is
verified by an automated test (`connect-src 'none'` present, `unsafe-eval` never present).

**The technical moat:** unlike VS Code extensions (which share a Node process with unrestricted
fs/network), a Nexine plugin gets **deterministic, host-enforced network denial**. Its iframe
ships `connect-src 'none'` unless an admin grants a scoped, _declared_ network permission — and
even then the host is never a proxy, so the app-wide no-egress guarantee can't leak.

Egress is therefore a **governed, opt-in capability, not a limitation**: an org can set network
to _deny-by-default_ and then allow exact hosts globally or per plugin (**Settings → Egress
control**, or a distributed policy file). See [`docs/governance.md`](docs/governance.md#controlling-egress).

See [`docs/security-model.md`](docs/security-model.md) for exactly how this is enforced and its
honest non-goals.

---

## Screenshots

|                                                                                                                                            |                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| ![A tool running in its sandbox](site/assets/screenshots/01-base64-dark.png)                                                               | ![The ⌘K command palette](site/assets/screenshots/02-command-palette.png)                |
| **Every tool runs in an opaque-origin sandbox** — note the `Sandboxed plugin` / `No network egress` badges and the per-plugin consent bar. | **⌘K command palette** — fuzzy-find and jump to any tool.                                |
| ![JWT decoder](site/assets/screenshots/03-jwt-dark.png)                                                                                    | ![Settings — plugins, trust, policy](site/assets/screenshots/04-settings.png)            |
| **JWT decoder** — decoded entirely locally; sensitive input is never persisted.                                                            | **Settings** — side-load signed plugins, pin publishers, set policy, read the audit log. |

<p align="center">
  <img src="site/assets/screenshots/05-json-light.png" alt="Light theme" width="720">
  <br><em>First-class light theme.</em>
</p>

---

## Tools

Over **50 tools** ship built-in — each a sandboxed plugin, enabled by default and removable.
Highlights include:

| Category        | Highlights                                                                              |
| --------------- | --------------------------------------------------------------------------------------- |
| **Crypto**      | JWT Decoder, Bcrypt Hash, AES Encrypt/Decrypt, RSA Key Gen, Certificate Decoder         |
| **Encoding**    | Base64, Hex Converter, URL Encode, HTML Entities, URL Parser                            |
| **Data & Text** | JSON Formatter, JSONPath, XML Formatter, CSV↔JSON, SQL Formatter, Text Diff, Markdown   |
| **Generators**  | UUID/ULID/NanoID, Password Gen, Fake Data, Lorem Ipsum, Placeholder Image, Random Bytes |
| **Time/Math**   | Timestamp, Cron Explainer, Date Math, Timezone, ISO8601 Parser                          |
| **Web/CSS**     | Color Converter, CSS Unit Converter, CSS Minifier, SVG to CSS, MIME Lookup, IPv4 CIDR   |

_See the application for the full catalog of 52 utilities._

Plus a **⌘K command palette**, starrable favorites, dark/light themes, and — on desktop — a
global summon hotkey.

---

## The plugin platform

Nexine's plugin platform is a **desktop-only capability**. First-party tools run in-process on both the web and desktop. Third-party plugins, side-loaded via signed `.nexpkg` packages, run in an opaque-origin, custom-protocol iframe with host-brokered RPC and a dynamic per-plugin Content-Security-Policy.

- **Public SDK** ([`@nexine/sdk`](packages/sdk)) — a stable, serializable manifest; a small,
  audited permission vocabulary (`network` with a host allowlist, `clipboard`, `storage`);
  plain-language `dataFlows` egress declarations; and a UI-framework-agnostic guest API
  (`definePlugin` → `mount(root)`).
- **Sandbox runtime** ([`@nexine/plugin-runtime`](packages/plugin-runtime)) — validates the
  manifest _before any code runs_, resolves permissions against policy, computes a **per-plugin
  CSP**, creates the `sandbox="allow-scripts"` iframe, and brokers storage/clipboard over a
  private `MessageChannel`. Deny-by-default: an ungranted capability is unreachable.
- **Signed packages** ([`@nexine/packaging`](packages/packaging) + [`@nexine/cli`](packages/cli)) —
  a `.nexpkg` is a manifest + a bundled classic-script module + a detached **Ed25519** signature.
  The `nexine` CLI does `keygen / pack / verify / inspect`, entirely locally.
- **DIY governance** — install-time consent (per plugin _and_ version), publisher trust, graduated
  policy modes (`allow → blocklist → lockdown`), **egress control** (deny-by-default network with
  global and per-plugin host allow-lists), a shareable **policy file**, and a metadata-only
  **audit log**. All on-device; no account.

Build one in [`docs/plugins.md`](docs/plugins.md); a working reference lives in
[`examples/cron-explainer`](examples/cron-explainer).

```bash
pnpm build:cli                                       # build the `nexine` binary
pnpm nexine keygen --label "My Plugins"              # Ed25519 keypair (keep *.key.json secret)
pnpm nexine pack examples/cron-explainer --key nexine.key.json
pnpm nexine verify dev.nexine.cron-explainer-1.0.0.nexpkg --trust nexine.pub.json
```

Then **Settings → Plugins → Choose `.nexpkg` file** to side-load it. It appears in the sidebar
under its category, alongside the builtins.

---

## Architecture

A **pnpm workspace monorepo** with strict, one-directional dependencies (everything points up
toward the framework-free `core`; ESLint forbids React in `core`).

| Package                                              | Role                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`packages/core`](packages/core)                     | Framework-free domain: `ToolMeta`, registry, search, and the CSP builder. No React, ever.           |
| [`packages/sdk`](packages/sdk)                       | The public plugin contract: manifest, permissions, data-flows, validation, RPC protocol, guest API. |
| [`packages/ui`](packages/ui)                         | The React design system: tokens, primitives, and the `ToolModule` contract.                         |
| [`packages/plugin-runtime`](packages/plugin-runtime) | The sandbox: permission engine, per-plugin CSP, RPC host, `loadPlugin` / `loadPackage`.             |
| [`packages/packaging`](packages/packaging)           | Signed `.nexpkg` format: canonical JSON, Ed25519 (WebCrypto), `TrustStore`.                         |
| [`packages/cli`](packages/cli)                       | The `nexine` binary — `keygen / pack / verify / inspect`.                                           |
| [`packages/host`](packages/host)                     | **The app**: shell, routing, storage, the sandbox host, builtins, and the governance UI.            |
| [`tools/*`](tools)                                   | One package per tool — a pure, unit-tested `transform`, reused by the builtins.                     |
| [`examples/*`](examples)                             | Sample plugins you can pack, sign, and side-load.                                                   |

Full detail — the dependency graph, the two-tier adapter seam, and where
state is persisted — is in [`docs/architecture.md`](docs/architecture.md).

---

## Development

Requires **Node ≥ 20** and **pnpm** (`packageManager: pnpm@11`).

```bash
pnpm install       # install workspace dependencies
pnpm dev           # start the dev server (http://localhost:5273)
pnpm test          # run unit tests (transforms, CSP, signing round-trip, permission engine)
pnpm typecheck     # type-check the monorepo
pnpm lint          # lint (also enforces import boundaries)
pnpm build         # production build (strict no-egress CSP)
pnpm build:cli     # build the `nexine` CLI binary (dist/bin.js)
```

---

## Desktop app (Tauri)

The same frontend ships as a native desktop app via [Tauri](https://tauri.app) (`src-tauri/`),
adding a global summon hotkey (⌘/Ctrl+Shift+Space) and OS-keychain-backed secret storage.
Building it requires the Rust toolchain, and icons must be generated once
(`pnpm tauri icon <image>`).

```bash
pnpm desktop:dev      # run the desktop app in development
pnpm desktop:build    # produce a native installer
```

> The desktop packaging follows the standard Tauri v2 layout and is compiled and integration-tested in CI across all platforms.

---

## Self-hosting

Nexine is static and backend-free. Build a Docker image or serve `packages/host/dist` from any
static host — including air-gapped networks. See [`docs/self-hosting.md`](docs/self-hosting.md).

```bash
docker build -f deploy/Dockerfile -t nexine .
docker run --rm -p 8080:80 nexine        # http://localhost:8080
```

The provided [`deploy/nginx.conf`](deploy/nginx.conf) also sends the no-egress CSP as a real
HTTP header (defense in depth), plus `X-Content-Type-Options`, `Referrer-Policy`, and a
restrictive `Permissions-Policy`.

---

## Documentation

| Doc                                              | Covers                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)     | Monorepo layout, package graph, the two-tier model, persistence.                  |
| [docs/security-model.md](docs/security-model.md) | The no-egress guarantee, the custom-protocol CSP, signed side-loading, non-goals. |
| [docs/plugins.md](docs/plugins.md)               | Authoring, packaging, signing, and side-loading a plugin.                         |
| [docs/governance.md](docs/governance.md)         | Consent, publisher trust, policy modes, the policy file, and the audit log.       |
| [docs/self-hosting.md](docs/self-hosting.md)     | Docker and static-host deployment, including air-gapped.                          |

---

## Roadmap

- **Phase 1 — MVP toolbox** ✅ shipped: the offline tools, no-egress CSP, palette, favorites,
  themes, desktop + self-host.
- **Phase 2 — Plugin platform (OSS)** ✅ functionally complete: SDK, iframe sandbox + permission
  engine, per-plugin CSP, signed side-load, the `nexine` CLI, and the local/DIY governance tier
  (consent, trust, policy modes, policy file, audit log).
- **Phase 3 — Ecosystem + Enterprise** ⏳ planned: community open registry → hosted marketplace →
  enterprise control plane (SSO, fleet policy distribution + drift detection, SIEM audit
  aggregation, supported air-gapped binary).

The full product plan — strategy, open-core boundary, and stage gates — is in
[`product-plan.md`](product-plan.md).

---

## License

[MIT](LICENSE). Open-core: the client, tools, sandbox, permission enforcement, and DIY local
governance are free and open source. (The hosted marketplace and enterprise control plane in
Phase 3 are the commercial line.)
