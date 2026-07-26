import { Panel } from '@nexine/ui';
import { BookOpen, ExternalLink, Github, Globe } from 'lucide-react';

export function AboutView() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[var(--nx-fg)]">About Nexine</h1>
        <p className="text-lg text-[var(--nx-fg-muted)]">
          The offline-first, no-egress developer toolbox.
        </p>
      </div>

      <div className="grid gap-6">
        <Panel className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[var(--nx-fg)]">Our Philosophy</h2>
          <p className="mb-4 text-sm text-[var(--nx-fg-muted)] leading-relaxed">
            Developer tools handle your most sensitive data—API keys, proprietary source code, and
            production database dumps. We believe you shouldn't have to paste this data into random
            ad-supported websites.
          </p>
          <p className="text-sm text-[var(--nx-fg-muted)] leading-relaxed">
            Nexine is built to be strictly local and offline-first. By default, it denies all
            network egress, providing a secure sandbox where your data stays on your machine.
          </p>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="https://github.com/nanduajith/nexine"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border border-[var(--nx-border)] bg-[var(--nx-surface)] p-5 transition-all hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-2)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--nx-radius)] bg-[var(--nx-bg)] text-[var(--nx-fg)]">
              <Github size={20} />
            </div>
            <h3 className="mb-1 font-semibold text-[var(--nx-fg)] flex items-center gap-1.5">
              GitHub Repository{' '}
              <ExternalLink
                size={14}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </h3>
            <p className="text-sm text-[var(--nx-fg-subtle)]">
              Star us, report issues, or contribute to the core platform.
            </p>
          </a>

          <a
            href="https://nanduajith.github.io/nexine/"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border border-[var(--nx-border)] bg-[var(--nx-surface)] p-5 transition-all hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-2)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--nx-radius)] bg-[var(--nx-primary-soft)] text-[var(--nx-primary)]">
              <Globe size={20} />
            </div>
            <h3 className="mb-1 font-semibold text-[var(--nx-fg)] flex items-center gap-1.5">
              Project Website{' '}
              <ExternalLink
                size={14}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </h3>
            <p className="text-sm text-[var(--nx-fg-subtle)]">
              Learn more about the platform architecture and releases.
            </p>
          </a>

          <a
            href="https://github.com/nanduajith/nexine/tree/main/docs"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border border-[var(--nx-border)] bg-[var(--nx-surface)] p-5 transition-all hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-2)] sm:col-span-2"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--nx-radius)] bg-[var(--nx-bg)] text-[var(--nx-fg)]">
              <BookOpen size={20} />
            </div>
            <h3 className="mb-1 font-semibold text-[var(--nx-fg)] flex items-center gap-1.5">
              Documentation{' '}
              <ExternalLink
                size={14}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </h3>
            <p className="text-sm text-[var(--nx-fg-subtle)]">
              Read our guides on architecture, security model, and how to build plugins.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
