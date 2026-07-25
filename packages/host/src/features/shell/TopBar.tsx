import { Button, cn, type ToolModule } from '@nexine/ui';
import { Star, WifiOff } from 'lucide-react';

import { usePreferences } from '../../app/hooks/usePreferences';
import { preferencesStore } from '../../infrastructure/storage/preferences-store';
import { toolIcon } from '../../lib/icons';
import { ThemeToggle } from '../theme/ThemeToggle';

interface TopBarProps {
  /** When present, renders the tool header (with a favorite star). */
  readonly tool?: ToolModule;
  /** Fallback header for non-tool surfaces (e.g. Settings). */
  readonly title?: string;
  readonly description?: string;
  readonly icon?: string;
}

export function TopBar({ tool, title, description, icon }: TopBarProps) {
  const { favorites } = usePreferences();
  const favorite = tool ? favorites.includes(tool.id) : false;
  const name = tool?.name ?? title;
  const desc = tool?.description ?? description;
  const Icon = toolIcon(tool?.icon ?? icon);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--nx-border)] px-5">
      <Icon size={18} className="shrink-0 text-[var(--nx-primary)]" />
      {name && (
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-[var(--nx-fg)]">{name}</h1>
          {desc && <p className="truncate text-xs text-[var(--nx-fg-subtle)]">{desc}</p>}
        </div>
      )}
      {tool && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={favorite ? `Unstar ${tool.name}` : `Star ${tool.name}`}
          onClick={() => preferencesStore.toggleFavorite(tool.id)}
          className={cn(favorite && 'text-[var(--nx-warning)]')}
        >
          <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span
          title="Everything runs in your browser — no network requests, ever."
          className="hidden items-center gap-1.5 rounded-full border border-[var(--nx-border)] px-2.5 py-1 text-[11px] text-[var(--nx-fg-muted)] sm:flex"
        >
          <WifiOff size={12} className="text-[var(--nx-success)]" />
          Local only
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
