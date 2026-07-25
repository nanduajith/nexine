//! Nexine desktop shell. The frontend is the same no-egress web app; the native
//! layer adds only what a browser cannot do: a global summon hotkey and
//! OS-keychain-backed secret storage. It never opens outbound network
//! connections of its own.

use keyring::Entry;

const KEYCHAIN_SERVICE: &str = "dev.nexine.app";

/// Store a secret in the OS keychain.
#[tauri::command]
fn secret_set(key: String, value: String) -> Result<(), String> {
    Entry::new(KEYCHAIN_SERVICE, &key)
        .map_err(|e| e.to_string())?
        .set_password(&value)
        .map_err(|e| e.to_string())
}

/// Read a secret from the OS keychain (returns `None` when absent).
#[tauri::command]
fn secret_get(key: String) -> Result<Option<String>, String> {
    match Entry::new(KEYCHAIN_SERVICE, &key)
        .map_err(|e| e.to_string())?
        .get_password()
    {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Delete a secret from the OS keychain (no-op when absent).
#[tauri::command]
fn secret_delete(key: String) -> Result<(), String> {
    match Entry::new(KEYCHAIN_SERVICE, &key)
        .map_err(|e| e.to_string())?
        .delete_credential()
    {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![secret_set, secret_get, secret_delete])
        .run(tauri::generate_context!())
        .expect("error while running Nexine");
}
