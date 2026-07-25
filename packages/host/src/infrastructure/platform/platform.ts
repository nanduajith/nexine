/**
 * Platform detection. The web and desktop builds share one codebase; anything
 * desktop-specific (global hotkey, OS keychain) is loaded lazily and only when
 * running inside the Tauri shell, so the web bundle never touches Tauri APIs.
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
