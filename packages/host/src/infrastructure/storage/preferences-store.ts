/**
 * Local, reactive preferences (favorites, recently-used tools, theme).
 *
 * Persistence is on-device only (localStorage) — no account, no sync, no egress.
 * Only tool *ids* and UI settings are stored here; tool inputs are never
 * persisted by this store. The implementation sits behind a small interface so
 * it can later be swapped for IndexedDB without touching consumers.
 */

export type Theme = 'dark' | 'light';

export interface Preferences {
  readonly favorites: readonly string[];
  readonly recents: readonly string[];
  readonly theme: Theme;
}

const STORAGE_KEY = 'nexine.preferences.v1';
const MAX_RECENTS = 8;

const DEFAULT_PREFERENCES: Preferences = {
  favorites: [],
  recents: [],
  theme: 'dark',
};

type Listener = () => void;

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter(isString) : [],
      recents: Array.isArray(parsed.recents) ? parsed.recents.filter(isString) : [],
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

class PreferencesStore {
  private state: Preferences = loadPreferences();
  private readonly listeners = new Set<Listener>();

  getSnapshot = (): Preferences => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  isFavorite(id: string): boolean {
    return this.state.favorites.includes(id);
  }

  toggleFavorite(id: string): void {
    const favorites = this.isFavorite(id)
      ? this.state.favorites.filter((favorite) => favorite !== id)
      : [...this.state.favorites, id];
    this.commit({ ...this.state, favorites });
  }

  recordUsage(id: string): void {
    const recents = [id, ...this.state.recents.filter((recent) => recent !== id)].slice(
      0,
      MAX_RECENTS,
    );
    this.commit({ ...this.state, recents });
  }

  setTheme(theme: Theme): void {
    this.commit({ ...this.state, theme });
  }

  /** Clear all locally stored preferences. */
  reset(): void {
    this.commit(DEFAULT_PREFERENCES);
  }

  private commit(next: Preferences): void {
    this.state = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private mode); keep working in-memory.
    }
    for (const listener of this.listeners) listener();
  }
}

export const preferencesStore = new PreferencesStore();
