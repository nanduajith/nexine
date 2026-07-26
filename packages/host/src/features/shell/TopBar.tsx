import { Button, cn, type ToolModule } from '@nexine/ui';
import { Star, WifiOff } from 'lucide-react';

import { usePreferences } from '../../app/hooks/usePreferences';
import { useTranslation } from '../../infrastructure/i18n';
import { preferencesStore, type Language } from '../../infrastructure/storage/preferences-store';
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
  const { t, lang } = useTranslation();

  // Try translating tool.name/description if it's a builtin
  const name = tool
    ? t(`tool.${tool.id}.name`) !== `tool.${tool.id}.name`
      ? t(`tool.${tool.id}.name`)
      : tool.name
    : title
      ? t(title)
      : undefined;
  const desc = tool
    ? t(`tool.${tool.id}.description`) !== `tool.${tool.id}.description`
      ? t(`tool.${tool.id}.description`)
      : tool.description
    : description
      ? t(description)
      : undefined;

  const favorite = tool ? favorites.includes(tool.id) : false;
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
          {t('Local only')}
        </span>
        <select
          value={lang}
          onChange={(e) => preferencesStore.setLanguage(e.target.value as Language)}
          className="h-7 cursor-pointer rounded-[var(--nx-radius)] border border-[var(--nx-border)] bg-[var(--nx-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--nx-fg)] outline-none hover:bg-[var(--nx-surface-3)] focus:border-[var(--nx-primary)]"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="ml">മലയാളം</option>
          <option value="no">Norsk</option>
          <option value="pt">Português</option>
          <option value="uk">Українська</option>
          <option value="vi">Tiếng Việt</option>
          <option value="zh">中文</option>
        </select>
        <ThemeToggle />
      </div>
    </header>
  );
}
