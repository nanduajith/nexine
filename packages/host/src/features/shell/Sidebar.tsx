import { getCategory } from '@nexine/core';
import { cn, Kbd, type ToolModule } from '@nexine/ui';
import { Home, Info, Lock, Search, Settings, ShieldCheck, Star } from 'lucide-react';
import { type ReactNode } from 'react';

import { usePreferences } from '../../app/hooks/usePreferences';
import type { ToolSections } from '../../app/hooks/useTools';
import { useTranslation } from '../../infrastructure/i18n';
import { pluginAdapter } from '../../infrastructure/platform/plugin-adapter';
import { preferencesStore } from '../../infrastructure/storage/preferences-store';
import { toolIcon } from '../../lib/icons';

interface SidebarProps {
  readonly activeId: string;
  readonly onNavigate: (toolId: string) => void;
  readonly onOpenPalette: () => void;
  readonly sections: ToolSections;
}

export function Sidebar({ activeId, onNavigate, onOpenPalette, sections }: SidebarProps) {
  const { favorites } = usePreferences();
  const { t } = useTranslation();
  const { categoryGroups, allTools } = sections;
  const favoriteTools = allTools.filter((tool) => favorites.includes(tool.id));

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--nx-border)] bg-[var(--nx-surface)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--nx-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--nx-radius)] bg-[var(--nx-primary-soft)]">
          <ShieldCheck size={16} className="text-[var(--nx-primary)]" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[var(--nx-fg)]">Nexine</span>
        <span className="ml-auto text-[10px] font-medium tracking-wide text-[var(--nx-fg-subtle)] uppercase">
          offline
        </span>
      </div>

      <div className="px-3 py-3 space-y-1">
        <button
          type="button"
          onClick={() => onNavigate('')}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[var(--nx-radius)] px-3 py-1.5 text-sm font-medium transition-colors mb-2',
            activeId === '' || (!sections.registry.get(activeId) && activeId !== 'settings')
              ? 'bg-[var(--nx-primary-soft)] text-[var(--nx-fg)]'
              : 'text-[var(--nx-fg-muted)] hover:bg-[var(--nx-surface-2)] hover:text-[var(--nx-fg)]',
          )}
        >
          <Home
            size={16}
            className={cn(
              activeId === '' || (!sections.registry.get(activeId) && activeId !== 'settings')
                ? 'text-[var(--nx-primary)]'
                : '',
            )}
          />
          <span>{t('Home')}</span>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex w-full items-center gap-2 rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 py-2 text-sm text-[var(--nx-fg-subtle)] transition-colors hover:border-[var(--nx-border-strong)]"
        >
          <Search size={15} />
          <span>{t('Search tools…')}</span>
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {favoriteTools.length > 0 && (
          <ToolGroup label={t('Favorites')}>
            {favoriteTools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                active={tool.id === activeId}
                favorite={favorites.includes(tool.id)}
                onNavigate={onNavigate}
              />
            ))}
          </ToolGroup>
        )}

        {categoryGroups.map(([category, tools]) => (
          <ToolGroup key={category} label={t(getCategory(category).label)}>
            {tools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                active={tool.id === activeId}
                favorite={favorites.includes(tool.id)}
                onNavigate={onNavigate}
              />
            ))}
          </ToolGroup>
        ))}
      </nav>

      <div className="border-t border-[var(--nx-border)] p-2 space-y-0.5">
        {!pluginAdapter.supportsPlugins && (
          <button
            type="button"
            onClick={() => window.open('https://github.com/nanduajith/nexine/releases', '_blank')}
            className="flex w-full items-center gap-2.5 rounded-[var(--nx-radius)] px-3 py-2 text-sm text-[var(--nx-fg-subtle)] transition-all hover:text-[var(--nx-fg)] hover:bg-[var(--nx-surface-2)] mb-1"
          >
            <Lock size={16} className="shrink-0" />
            <span className="truncate font-medium">{t('Plugins require App')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[var(--nx-radius)] px-3 py-2 text-sm transition-colors',
            activeId === 'settings'
              ? 'bg-[var(--nx-primary-soft)] text-[var(--nx-fg)]'
              : 'text-[var(--nx-fg-muted)] hover:bg-[var(--nx-surface-2)]',
          )}
        >
          <Settings
            size={16}
            className={cn('shrink-0', activeId === 'settings' && 'text-[var(--nx-primary)]')}
          />
          <span className="font-medium">{t('Settings')}</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('about')}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[var(--nx-radius)] px-3 py-2 text-sm transition-colors',
            activeId === 'about'
              ? 'bg-[var(--nx-primary-soft)] text-[var(--nx-fg)]'
              : 'text-[var(--nx-fg-muted)] hover:bg-[var(--nx-surface-2)]',
          )}
        >
          <Info
            size={16}
            className={cn('shrink-0', activeId === 'about' && 'text-[var(--nx-primary)]')}
          />
          <span className="font-medium">{t('About')}</span>
        </button>
      </div>
    </aside>
  );
}

function ToolGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-semibold tracking-wider text-[var(--nx-fg-subtle)] uppercase">
        {icon}
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface ToolRowProps {
  readonly tool: ToolModule;
  readonly active: boolean;
  readonly favorite: boolean;
  readonly onNavigate: (toolId: string) => void;
}

function ToolRow({ tool, active, favorite, onNavigate }: ToolRowProps) {
  const { t } = useTranslation();
  const Icon = toolIcon(tool.icon);
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-[var(--nx-radius)] pr-1 transition-colors',
        active ? 'bg-[var(--nx-primary-soft)]' : 'hover:bg-[var(--nx-surface-2)]',
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate(tool.id)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5 text-sm',
          active ? 'text-[var(--nx-fg)]' : 'text-[var(--nx-fg-muted)]',
        )}
      >
        <Icon size={16} className={cn('shrink-0', active ? 'text-[var(--nx-primary)]' : '')} />
        <span className="truncate font-medium">{t(`tool.${tool.id}.name`)}</span>
      </button>
      <button
        type="button"
        aria-label={favorite ? `Unstar ${tool.name}` : `Star ${tool.name}`}
        aria-pressed={favorite}
        onClick={() => preferencesStore.toggleFavorite(tool.id)}
        className={cn(
          'shrink-0 rounded p-1 transition-opacity',
          favorite
            ? 'text-[var(--nx-warning)] opacity-100'
            : 'text-[var(--nx-fg-subtle)] opacity-0 hover:text-[var(--nx-fg)] focus-visible:opacity-100 group-hover:opacity-100',
        )}
      >
        <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
