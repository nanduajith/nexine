import { useCallback, useEffect, useState } from 'react';

import { AboutView } from '../features/about/AboutView';
import { CommandPalette } from '../features/command-palette/CommandPalette';
import { HomeView } from '../features/home/HomeView';
import { SettingsView } from '../features/plugins/SettingsView';
import { Sidebar } from '../features/shell/Sidebar';
import { TopBar } from '../features/shell/TopBar';
import { initDesktopIntegration } from '../infrastructure/platform';
import { preferencesStore } from '../infrastructure/storage/preferences-store';

import { useHashRoute } from './hooks/useHashRoute';
import { usePreferences } from './hooks/usePreferences';
import { useTools } from './hooks/useTools';

/** Reserved route id for the Settings surface (not a tool). */
const SETTINGS_ROUTE = 'settings';
/** Reserved route id for the About page. */
const ABOUT_ROUTE = 'about';

export function App() {
  const [activeId, navigate] = useHashRoute();
  const { theme } = usePreferences();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sections = useTools();
  const { registry } = sections;

  const isSettings = activeId === SETTINGS_ROUTE;
  const isAbout = activeId === ABOUT_ROUTE;
  // Resolve the active tool
  const currentTool = registry.get(activeId);
  const isHome = activeId === '' || (!isSettings && !isAbout && !currentTool);

  // Apply the theme to the document root.
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  // Track recently-used tools (ids only — never inputs). Settings is not a tool.
  useEffect(() => {
    if (!isSettings && currentTool) preferencesStore.recordUsage(currentTool.id);
  }, [isSettings, currentTool]);

  // Global command-palette hotkey (⌘K / Ctrl+K).
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Desktop only: register the global hotkey that summons Nexine + the palette.
  useEffect(() => {
    void initDesktopIntegration(() => setPaletteOpen((open) => !open));
  }, []);

  const handleSelect = useCallback(
    (toolId: string) => {
      navigate(toolId);
    },
    [navigate],
  );

  const ToolView = currentTool?.view;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        activeId={activeId}
        onNavigate={navigate}
        onOpenPalette={() => setPaletteOpen(true)}
        sections={sections}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {isSettings ? (
          <>
            <TopBar
              title="Settings"
              description="Plugins, publisher trust, and policy"
              icon="Settings"
            />
            <main className="min-h-0 flex-1">
              <SettingsView />
            </main>
          </>
        ) : isAbout ? (
          <>
            <TopBar title="About" description="Project philosophy and links" icon="Info" />
            <main className="flex-1 overflow-y-auto bg-[var(--nx-bg)]">
              <AboutView />
            </main>
          </>
        ) : isHome ? (
          <>
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-[var(--nx-bg)]">
              <HomeView
                onNavigate={navigate}
                onOpenPalette={() => setPaletteOpen(true)}
                sections={sections}
              />
            </main>
          </>
        ) : currentTool && ToolView ? (
          <>
            <TopBar tool={currentTool} />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl px-6 py-6">
                <ToolView meta={currentTool} />
              </div>
            </main>
          </>
        ) : (
          <div className="p-8 text-sm text-[var(--nx-fg-muted)]">No tools registered.</div>
        )}
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleSelect}
        registry={registry}
      />
    </div>
  );
}
