import { Button } from '@nexine/ui';
import { Moon, Sun } from 'lucide-react';

import { usePreferences } from '../../app/hooks/usePreferences';
import { preferencesStore } from '../../infrastructure/storage/preferences-store';

export function ThemeToggle() {
  const { theme } = usePreferences();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${next} theme`}
      onClick={() => preferencesStore.setTheme(next)}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
