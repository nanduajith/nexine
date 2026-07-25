# Nexine — Product Plan

_Offline-first developer utility platform (standalone tool → plugin platform → enterprise)_

## Context

**Problem.** Enterprise developers paste JWTs, tokens, secrets, and PII into random online dev-tool sites (`jwt.io`, `jsonformatter.org`) — pervasive **Shadow IT in the developer workflow**. Every CISO knows it happens; nobody offers a viable, governable alternative.

**What we're building (phased).** **Nexine** — a **100% client-side, no-egress developer toolbox** that ships as a **cross-platform desktop app** (Tauri) and a **self-hostable web app** from one codebase. It grows into a **plugin platform** ("VS Code for dev tools") and, later, a governed **enterprise** product + marketplace. Open source (MIT) core.

**Name / brand.** _Nexine_ — after the **nexine**, the inner protective layer of a pollen-grain wall — reinforcing the core promise: a hardened shell that keeps sensitive data inside. (To secure: `nexine.dev`/`.io`, trademark clearance in Nice classes 9/42; note faint proximity to Sonatype _Nexus_ in the registry space.)

**Strategic decisions (made with the user, stress-tested against an external exec review):**

- **MVP = standalone-tool-first.** V1 is a genuinely great offline toolbox (15–20 first-party tools, superb UX, global hotkey) — _fully useful with zero third-party plugins_. This solves the plugin cold-start problem (an empty plugin host is a ghost town).
- **Architecture underneath is plugin-ready, but the platform is sequenced later.** Tools are built against a clean internal `ToolModule` interface that later hardens into the public SDK. The per-plugin **iframe sandbox + permission engine is Phase 2** — you only need it once untrusted third-party plugins exist. V1's no-egress guarantee comes from a blanket **app-level strict CSP**.
- **Governance is real because the host owns the plugin lifecycle** (the key insight: client-side governance is enforceable only when a host controls what loads, from where, with what permissions).
- **Open-core = GitLab model.** _Free OSS_ = client + tools + sandbox + permission enforcement + **local/DIY governance** (local policy file, side-load, basic allow/block) — must be free, both for trust/adoption and because client-side enforcement can't be hidden anyway. _Paid Enterprise_ = the **control plane you can't self-build**: central management console, SSO/SAML, fleet policy distribution + drift detection, audit aggregation → SIEM, and a **supported self-hosted enterprise binary** (HashiCorp-style, for air-gap) — plus the hosted marketplace.
- **Templates:** VS Code (open host + closed marketplace + extension policies), Bruno (MIT offline core, no-telemetry, git-native, bottom-up adoption).

**The technical moat to message relentlessly:** unlike VS Code extensions (shared Node process, unrestricted fs/network), this platform provides **deterministic, host-enforced network denial** — tools physically cannot exfiltrate unless an admin grants a scoped, declared permission.

## Product timeline & roadmap

_Durations are indicative for 1–2 engineers, built sequentially; parallelize with more people. **Each stage is gated by its exit criteria — and from Stage 1 onward, by real adoption signals — before investing in the next.** Do not build the marketplace or enterprise machinery until adoption validates it (avoids the "beloved ghost town" and premature-enterprise traps)._

| Stage                                                        | Timeframe          | Goal                                             | Key deliverables                                                                                                                                                                                                                                                                 | Exit criteria / success signal                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 — Foundation**                                           | Wks 0–2            | Skeleton that can grow                           | Monorepo, host shell, `ToolModule` interface, baseline CSP, CI (incl. cross-webview), Tauri + Docker build                                                                                                                                                                       | Shell renders; one tool works end-to-end; desktop + web + Docker builds green                                                                                                   |
| **1 — MVP: Standalone OSS toolbox** _(Phase 1)_              | Wks 2–10 (~2 mo)   | A toolbox devs love, useful with zero plugins    | 15–20 first-party tools, favorites/history, command palette, **global hotkey**, no-egress CSP, no account/telemetry, desktop + self-host                                                                                                                                         | **Public OSS (MIT) launch.** Verified zero-egress; works fully offline; early GitHub traction (stars/installs). GTM: Show HN / Reddit / dev communities (Bruno-style bottom-up) |
| **2 — Plugin platform (OSS)** _(Phase 2)_                    | Wks 10–22 (~3 mo)  | Open the architecture; make it extensible & safe | Public **SDK** + open manifest/package format, **iframe sandbox + permission engine** (deny-by-default + `dataFlows`), Transferable/Worker large-payload path, side-load of **signed** plugins, **local/DIY governance** (local policy, allow/block, observe→blocklist→lockdown) | A third party can build + sign + side-load a plugin; permission denial is provable; first external community plugins appear                                                     |
| **3 — Ecosystem: registries + marketplace** _(Phase 3a)_     | Wks 22–34 (~3 mo)  | Distribution + first revenue                     | Community **open registry** (OSS, Open-VSX analog); **hosted commercial marketplace** (proprietary): publish & **sell** tools, verified publishers, payments                                                                                                                     | Developers publish free tools and sell paid ones; first paid transaction; catalog breadth from external publishers                                                              |
| **4 — Enterprise control plane (monetization)** _(Phase 3b)_ | Wks 34–50+ (~4 mo) | Convert Fortune-500 InfoSec                      | **Central management console, SSO/SAML, fleet policy distribution + drift detection, audit aggregation → SIEM**, OS-managed policy enforcement, **supported self-hosted enterprise binary** (air-gap), SBOM/SLSA signing                                                         | A design-partner enterprise deploys fleet-wide with locked policy + SSO + audit; first paying enterprise / design partners                                                      |

**Open-core boundary reminder (GitLab model):** everything through **Stage 2** (client, tools, sandbox, permission enforcement, DIY local governance) is **free OSS**. Revenue begins at **Stage 3** (hosted marketplace) and **Stage 4** (enterprise control plane + supported self-hosted binary).

## Phase 1 — Standalone OSS toolbox (the MVP)

A complete, lovable product on its own. License **MIT**.

**Scope:**

- **Host shell** — nav, fuzzy **command palette**, favorites/starring, per-tool history (IndexedDB; **sensitive-tool history off by default** — never silently persist tokens).
- **Clean internal `ToolModule` interface** — `{ id, name, category, keywords, transform, Component }`. This is the proto-SDK; every tool is written against it so the interface is battle-tested before it's ever made public.
- **15–20 first-party tools** covering ~90% of use: JWT (decode/verify/sign via `jose`), Base64 (text+file, URL-safe), URL encode/decode + query parse, Hash/HMAC (SHA-2, WebCrypto), JSON (format/minify/validate/query), UUID/ULID, RegEx tester, cron parser, timestamp/epoch, hex/binary, JSON↔YAML, diff, case/slug, color, QR, `.env`↔JSON, x509/cert inspect. (Build these; don't wait for a community.)
- **No-egress via app-level strict CSP** (`default-src 'self'; connect-src 'none'`, relaxed per-tool only where a user explicitly opts into e.g. JWKS fetch). No account, no telemetry — the headline trust story.
- **Global hotkey** (Raycast/Spotlight-style summon-over-IDE) to beat context-switch friction — Tauri global shortcut.
- **Distribution:** Tauri 2 desktop (Win/macOS/Linux) + nginx/Docker self-host, same static build.

**Secrets at rest:** desktop persists any opt-in sensitive data via **OS keychain** (Tauri keychain/Stronghold); the **web build persists nothing sensitive — ephemeral by default** (no keychain exists in a browser; optional passphrase-derived WebCrypto encryption only if a user insists).

## Phase 2 — Plugin platform (still OSS, DIY governance free)

Harden the internal interface into a public ecosystem — _now_ the sandbox matters (untrusted code arrives).

- **Public Plugin SDK + open manifest/package format** (VSIX analog); community can build tools.
- **Sandboxed iframe runtime** — each plugin in a strict-`sandbox` iframe + per-plugin CSP, `postMessage` RPC to host; host mediates all I/O. Plugin cannot touch host DOM/storage/network directly.
- **Permission model** — manifest declares `permissions` (`network` with `hosts` allowlist, `clipboard`, `filesystem` scoped, `storage`, `crypto`) **+ `dataFlows` egress declaration**; **deny-all by default**; install-time consent shows exactly what data leaves. Enforced by the sandbox, not trust.
- **Large-payload path:** RPC uses **Transferable `ArrayBuffer`s (zero-copy move)** — _not_ SharedArrayBuffer (which forces COOP/COEP headers that fight the sandbox/CSP). Heavy compute runs in a Worker so a 50MB JSON paste doesn't jank the UI.
- **Local/DIY governance (free):** local policy file, side-load of **signed** plugins, basic allow/block, and **graduated policy modes** — _observe/audit → blocklist → lockdown_ (avoid the "3-week IT-ticket allowlist kills adoption" trap; audit logs metadata + declared data-flows, never payloads).

## Phase 3 — Ecosystem + Enterprise (monetization)

- **Community open registry** (vendor-neutral, Open-VSX analog) — OSS.
- **Hosted commercial marketplace** — publish & _sell_ custom tools, verified publishers, payments — **proprietary** (the VS Code Marketplace analog).
- **Enterprise control plane (paid, GitLab-EE line):** central management console, **SSO/SAML**, **fleet policy distribution + drift detection**, **audit aggregation → SIEM/dashboard**, permission-ceiling enforcement at fleet scale, signed supply-chain (SBOM/SLSA), and a **supported self-hosted enterprise binary** for air-gapped orgs. Managed policy is read from unbypassable OS-managed locations (GPO/registry, macOS config profile, `/etc`) on managed devices.

_Honest boundary:_ enterprise enforcement is real on **managed devices + the self-hosted instance** (where corporate work happens), not on unmanaged personal machines — same scope as Chrome/VS Code enterprise policy.

## Files / structure (greenfield; Phase 1 first)

- `packages/host/` — shell, command palette, favorites/history storage, `ToolModule` interface, global-hotkey (Tauri), app CSP.
- `tools/*/` — 15–20 first-party tools implementing `ToolModule`.
- `src-tauri/` — Tauri 2 config, OS keychain integration, (Phase 3) managed-policy readers.
- `deploy/Dockerfile`, `deploy/nginx.conf`.
- _(Phase 2+)_ `packages/sdk/`, `packages/plugin-runtime/` (iframe sandbox + RPC + permission engine), `packages/policy-engine/`, `packages/registry-*`.
- `docs/{security-model,self-hosting}.md` (P1); `{plugin-api,manifest-permissions,managed-policy}.md` (P2–3); `README.md`, `LICENSE` (MIT).

## Verification

**Phase 1 (must prove now):**

- `pnpm dev` → exercise each of the ~15 tools with real inputs.
- **No-egress:** DevTools Network shows zero external requests during use; CSP blocks a deliberate test fetch (`connect-src 'none'`).
- **Favorites/history:** star a tool + run inputs → survive reload; sensitive-tool history stays off; wipe-all clears storage.
- **Global hotkey:** summon the app over another window (desktop).
- **Self-host/desktop:** Docker image runs fully offline (disconnect network); `tauri build` app launches and smoke-tests a tool + keychain persistence.
- **Cross-webview:** manually verify (and wire CI for) WebView2 (Win), WebKit (macOS), **WebKitGTK (Linux)** — CSP/rendering differ across engines; don't assume Chrome behavior maps 1:1.

**Phase 2 (security-model proofs, when built):** a plugin denied `network` cannot fetch; a `network: deny` policy forces even a granted plugin offline; an unsigned side-loaded plugin is rejected; large-payload transfer via Transferable doesn't block the UI.

(Use the preview MCP tools to load the host, run tools, and inspect the network panel to prove no-egress.)

## Suggested build order

1. Host shell + `ToolModule` interface + storage (favorites/history) + command palette.
2. Build the 15–20 first-party tools (JWT/JSON/Base64/URL/Hash first).
3. Strict app CSP (no-egress) + no account/telemetry + `docs/security-model.md`.
4. Tauri desktop (global hotkey, OS keychain) + Docker self-host + cross-webview CI.
5. **Ship v1 as a standalone OSS toolbox.** Gather adoption.
6. Phase 2: harden `ToolModule` → public SDK; iframe sandbox + permission engine (deny-by-default, dataFlows); side-load signed plugins; local policy + audit/observe mode.
7. Phase 3: community registry → hosted marketplace (proprietary) → Enterprise control plane (SSO, fleet policy, audit, supported self-hosted binary). Draw the paid line here.
