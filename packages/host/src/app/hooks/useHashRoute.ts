import { useCallback, useSyncExternalStore } from 'react';

function readToolId(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/**
 * Minimal hash-based routing (no router dependency — keeps the bundle small and
 * the surface auditable). Returns the active tool id and a navigate function.
 */
export function useHashRoute(): readonly [string, (toolId: string) => void] {
  const toolId = useSyncExternalStore(subscribe, readToolId);
  const navigate = useCallback((next: string) => {
    window.location.hash = `#/${next}`;
  }, []);
  return [toolId, navigate];
}
