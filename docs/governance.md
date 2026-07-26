# Governance (DIY tier)

Governance is what makes Nexine safe to open up to third-party plugins. The **free, DIY tier**
is entirely on-device — no account, no egress — and is enforceable precisely because the host
owns the plugin lifecycle: it decides what loads, from where, and with what permissions.

Everything here lives under **Settings** (bottom-left of the sidebar) and is persisted in the
`nexine.governance.v1` and `nexine.audit.v1` `localStorage` stores.

> The paid **enterprise** tier (Phase 3) layers a managed, unbypassable policy — central
> console, SSO, fleet distribution, drift detection, SIEM aggregation — on top of this same
> engine. See [`../product-plan.md`](../product-plan.md). The free tier below is complete and
> shipping.

## Install-time consent

Every tool — builtin or side-loaded — shows a **consent card on first open**, listing the exact
permissions it will use (or "No permissions" for a pure, zero-egress tool). Consent is recorded
**per plugin and per version**: a version bump invalidates prior consent, so a plugin that
changes its permissions must be re-approved. From the run view you can **Revoke consent** or
**Block** a plugin at any time.

## Publisher trust

Signed packages carry an Ed25519 signature, but a valid signature never implies trust — that is
your decision. In **Settings → Publisher trust** you can:

- **Pin** a publisher's public key (so their packages show as trusted).
- Toggle **Require a trusted publisher** — when on, a package signed by an unpinned key is
  _blocked_ instead of merely consent-gated.

## Policy modes

The permission engine supports a graduated posture (the plan's _observe → blocklist →
lockdown_ ladder). A `PluginPolicy` has:

| Field                          | Effect                                                                   |
| ------------------------------ | ------------------------------------------------------------------------ |
| `mode: 'allow'`                | Plugins load unless explicitly blocked (the DIY/observe default).        |
| `mode: 'blocklist'`            | Same as allow, but the block list is the primary control.                |
| `mode: 'lockdown'`             | Only ids in `allowedPlugins` may load; everything else is denied.        |
| `blockedPlugins`               | Ids that never load, in any mode.                                        |
| `allowedPlugins`               | The allowlist consulted under `lockdown`.                                |
| `deniedPermissions`            | Permission ids stripped from every plugin (a ceiling).                   |
| `allowedHosts`                 | A global network-host ceiling that narrows any plugin's `network` grant. |
| `networkRequiresExplicitAllow` | The egress posture (see below).                                          |
| `pluginHosts`                  | Per-plugin network-host grants, keyed by plugin id.                      |

Resolution is: block list → mode (lockdown allowlist) → per-permission ceilings → network-host
narrowing. Capabilities that don't survive resolution are simply not granted, and the plugin's
iframe CSP reflects the narrowed result.

## Controlling egress

Nexine does not have to _cripple_ a plugin to keep egress under control — network access is a
**scoped, admin-granted capability**, not an on/off switch. Two policy fields govern it:

- **`networkRequiresExplicitAllow`** sets the posture:
  - `false` (the DIY default) — **open**: a plugin's declared hosts are granted as-is (still
    narrowed by `allowedHosts`/`pluginHosts` if you set them).
  - `true` (the enterprise posture) — **default-deny egress**: a `network` permission is granted
    _only_ for hosts you explicitly allow-list. A plugin keeps all its other capabilities; it just
    can't reach the network until an admin names a host.
- **`allowedHosts`** is the global allow-list, and **`pluginHosts`** grants extra hosts to _one_
  specific plugin — e.g. letting a single tool reach an internal JWKS endpoint that no other plugin
  may touch.

A plugin's granted hosts become its iframe's `connect-src`; a plugin with no granted host gets
`connect-src 'none'`. Crucially, **the host is never a proxy** and the app document itself always
ships `connect-src 'none'`, so granting a plugin scoped egress never weakens the app-wide no-egress
guarantee. This bounds _where_ a plugin can connect (exact origins), not _what_ it sends — payload
inspection would require a proxy, which would defeat the guarantee for everyone.

## The policy file

**Settings → Policy file** exports the _shareable_ slice of governance to a JSON document you
can distribute across devices (the DIY tier of fleet policy):

```jsonc
{
  "version": 1,
  "policy": {
    "mode": "allow",
    "blockedPlugins": [],
    // Default-deny egress: no plugin reaches the network unless allow-listed below.
    "networkRequiresExplicitAllow": true,
    "allowedHosts": ["https://jwks.corp.example"], // every plugin may reach this
    "pluginHosts": {
      "dev.acme.reporter": ["https://reports.corp.example"], // only this plugin
    },
  },
  "trust": { "publishers": [/* pinned public keys */], "requireTrusted": false },
  "disabledBuiltins": [/* builtin ids removed from the tool list */],
}
```

Importing applies `policy`, `trust`, and `disabledBuiltins`. It deliberately **does not** carry
per-device consents or installed packages — those stay local to each device.

## The audit log

**Settings → Activity log** is an on-device record of _what the host decided_ — a capped
(500-entry), reactive ring buffer in `nexine.audit.v1`. It records governance **metadata only**
and **never** any plugin input, output, or payload — the same privacy line the enterprise audit
pipeline will hold.

Recorded event types:

```
plugin.install · plugin.uninstall · builtin.remove · builtin.restore
consent.grant · consent.deny · consent.revoke
plugin.block · plugin.unblock · publisher.pin · publisher.unpin · policy.import
```

Each entry is `{ id, at, type, subject, detail? }` where `subject` is a plugin id or publisher
label and `detail` is optional metadata (e.g. the granted permission ids) — never a payload.
The log can be exported to JSON or cleared.

## What is stored where

| Store (`localStorage` key) | Contents                                                      | Notes                                                                             |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `nexine.governance.v1`     | policy, consents, trust, installed packages, removed builtins | The full signed package is kept so its signature can be re-verified on every run. |
| `nexine.preferences.v1`    | theme, favorites, recent tool ids                             | Never any tool input or output.                                                   |
| `nexine.audit.v1`          | the activity log                                              | Metadata only, capped ring buffer.                                                |

Nothing is written to the filesystem and nothing is sent anywhere — consistent with the
[security model](security-model.md).
