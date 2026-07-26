import { type ToolModule } from '@nexine/ui';
import { Compass, Download, Lock, Search, ShieldCheck } from 'lucide-react';

import type { ToolSections } from '../../app/hooks/useTools';
import { useTranslation } from '../../infrastructure/i18n';
import { pluginAdapter } from '../../infrastructure/platform/plugin-adapter';
import { preferencesStore } from '../../infrastructure/storage/preferences-store';
import { toolIcon } from '../../lib/icons';

interface HomeViewProps {
  onNavigate: (toolId: string) => void;
  onOpenPalette: () => void;
  sections: ToolSections;
}

export function HomeView({ onNavigate, onOpenPalette, sections }: HomeViewProps) {
  const { t } = useTranslation();
  const { allTools } = sections;
  // Get recent tools directly from the store (this updates on load, which is fine for Home)
  const recentIds = preferencesStore.getSnapshot().recents;
  const recentTools = recentIds
    .map((id: string) => allTools.find((t: ToolModule) => t.id === id))
    .filter((t: ToolModule | undefined): t is ToolModule => t !== undefined)
    .slice(0, 8); // top 8

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header & Search */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[var(--nx-fg)]">
          {t('Welcome to Nexine')}
        </h1>
        <p className="mb-8 text-lg text-[var(--nx-fg-muted)]">
          {t('Your offline-first, no-egress developer toolbox.')}
        </p>
        <button
          type="button"
          onClick={onOpenPalette}
          className="mx-auto flex w-full max-w-md items-center gap-3 rounded-full border border-[var(--nx-border)] bg-[var(--nx-surface)] px-6 py-3 text-left text-[var(--nx-fg-muted)] shadow-sm transition-colors hover:border-[var(--nx-border-strong)] hover:text-[var(--nx-fg)]"
        >
          <Search size={18} />
          <span className="flex-1 text-base">
            {t('Search')} {allTools.length} {t('tools...')}
          </span>
          <kbd className="rounded border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-2 py-0.5 font-mono text-xs text-[var(--nx-fg-subtle)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-10 md:grid-cols-2">
        {/* Left Column: Recent / Discover */}
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--nx-fg)]">
            <Compass className="text-[var(--nx-primary)]" size={20} />
            {recentTools.length > 0 ? t('Recently Used') : t('Discover Tools')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(recentTools.length > 0 ? recentTools : allTools.slice(0, 8)).map(
              (tool: ToolModule) => {
                const Icon = toolIcon(tool.icon);
                return (
                  <button
                    key={tool.id}
                    onClick={() => onNavigate(tool.id)}
                    className="flex items-center gap-3 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface)] p-3 text-left transition-all hover:border-[var(--nx-primary-soft)] hover:bg-[var(--nx-surface-2)]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--nx-bg)] text-[var(--nx-primary)]">
                      <Icon size={16} />
                    </div>
                    <span className="truncate font-medium text-[var(--nx-fg)] text-sm">
                      {t(`tool.${tool.id}.name`) !== `tool.${tool.id}.name`
                        ? t(`tool.${tool.id}.name`)
                        : tool.name}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Right Column: Upsell for Web, or Stats for Desktop */}
        <div>
          {!pluginAdapter.supportsPlugins ? (
            <div className="overflow-hidden rounded-xl border border-[var(--nx-border-strong)] bg-gradient-to-b from-[var(--nx-surface-2)] to-[var(--nx-surface)]">
              <div className="border-b border-[var(--nx-border)] bg-[var(--nx-surface-3)] px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--nx-fg)]">
                  <ShieldCheck className="text-[var(--nx-primary)]" size={20} />
                  {t('Unlock Desktop Features')}
                </h2>
                <p className="mt-1 text-sm text-[var(--nx-fg-muted)]">
                  {t(
                    'You are using the lightweight web version. Download the desktop app for full platform access.',
                  )}
                </p>
              </div>
              <div className="p-5">
                <ul className="mb-6 space-y-4">
                  <li className="flex items-start gap-3 opacity-60 grayscale transition-all hover:opacity-80">
                    <div className="mt-0.5 rounded bg-[var(--nx-surface-3)] p-1.5 text-[var(--nx-fg-subtle)]">
                      <Lock size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--nx-fg)]">
                        {t('Third-party Plugins')}
                      </h3>
                      <p className="text-xs text-[var(--nx-fg-subtle)] mt-0.5">
                        {t('Install custom tools from the community registry.')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 opacity-60 grayscale transition-all hover:opacity-80">
                    <div className="mt-0.5 rounded bg-[var(--nx-surface-3)] p-1.5 text-[var(--nx-fg-subtle)]">
                      <Lock size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--nx-fg)]">
                        {t('Global Hotkey')}
                      </h3>
                      <p className="text-xs text-[var(--nx-fg-subtle)] mt-0.5">
                        {t('Summon Nexine instantly over any window with ⌘⇧Space.')}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 opacity-60 grayscale transition-all hover:opacity-80">
                    <div className="mt-0.5 rounded bg-[var(--nx-surface-3)] p-1.5 text-[var(--nx-fg-subtle)]">
                      <Lock size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--nx-fg)]">
                        {t('Local Filesystem Access')}
                      </h3>
                      <p className="text-xs text-[var(--nx-fg-subtle)] mt-0.5">
                        {t('Process local files securely without uploading.')}
                      </p>
                    </div>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    window.open('https://github.com/nanduajith/nexine/releases', '_blank')
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--nx-radius)] bg-[var(--nx-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--nx-primary-hover)] transition-colors"
                >
                  <Download size={16} />
                  {t('Download Desktop App')}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--nx-border)] bg-[var(--nx-surface)] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--nx-fg)]">
                {t('System Status')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-[var(--nx-surface-2)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--nx-fg)]">
                    {t('Built-in Tools')}
                  </span>
                  <span className="text-sm font-bold text-[var(--nx-primary)]">
                    {allTools.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--nx-surface-2)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--nx-fg)]">
                    {t('Network Egress')}
                  </span>
                  <span className="text-sm font-bold text-[var(--nx-warning)]">
                    {t('Deny-by-default')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--nx-surface-2)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--nx-fg)]">
                    {t('App Platform')}
                  </span>
                  <span className="text-sm font-bold text-[var(--nx-primary)]">
                    {t('Desktop Native')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
