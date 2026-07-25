# Nexine documentation

Nexine is a 100% client-side, no-egress developer toolbox that grows into a governed,
sandboxed plugin platform. These documents describe how it is built, how it stays safe, and
how to extend it.

## Contents

| Doc                                    | What it covers                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)     | The monorepo layout, the package dependency graph, and the "everything is a sandboxed plugin" execution model.    |
| [security-model.md](security-model.md) | The no-egress guarantee, how the CSP enforces it, the plugin sandbox, and honest non-goals.                       |
| [plugins.md](plugins.md)               | Authoring a plugin: the manifest, permissions, the guest SDK, packaging + signing with the CLI, and side-loading. |
| [governance.md](governance.md)         | The DIY governance tier: install-time consent, publisher trust, policy modes, the policy file, and the audit log. |
| [self-hosting.md](self-hosting.md)     | Serving Nexine from Docker or any static host, including air-gapped deployments.                                  |

## Start here

- **Using Nexine / self-hosting it?** Read [security-model.md](security-model.md) then
  [self-hosting.md](self-hosting.md).
- **Building a plugin?** Read [plugins.md](plugins.md).
- **Contributing to the core?** Read [architecture.md](architecture.md).
- **The full product roadmap** lives in [`../product-plan.md`](../product-plan.md).
