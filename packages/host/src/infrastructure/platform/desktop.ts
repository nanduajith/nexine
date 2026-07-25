import { isDesktop } from './platform';
import type { SecretStore } from './secret-store';

/**
 * OS-keychain-backed secret store (desktop only). Delegates to Tauri commands
 * that use the platform keyring (Keychain / Credential Manager / Secret Service).
 * The Tauri APIs are imported lazily so this module is inert on the web.
 */
export function createDesktopSecretStore(): SecretStore {
  return {
    async get(key) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<string | null>('secret_get', { key });
    },
    async set(key, value) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('secret_set', { key, value });
    },
    async delete(key) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('secret_delete', { key });
    },
  };
}

/**
 * Registers the global hotkey (⌘/Ctrl+Shift+Space) that summons Nexine over any
 * other window and toggles the command palette. No-op on the web build.
 */
export async function initDesktopIntegration(onTogglePalette: () => void): Promise<void> {
  if (!isDesktop()) return;

  const [{ register }, { getCurrentWindow }] = await Promise.all([
    import('@tauri-apps/plugin-global-shortcut'),
    import('@tauri-apps/api/window'),
  ]);

  await register('CmdOrCtrl+Shift+Space', async (event) => {
    if (event.state !== 'Pressed') return;
    const appWindow = getCurrentWindow();
    await appWindow.show();
    await appWindow.setFocus();
    onTogglePalette();
  });
}
