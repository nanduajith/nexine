//! Nexine desktop shell. The frontend is the same no-egress web app; the native
//! layer adds only what a browser cannot do: a global summon hotkey and
//! OS-keychain-backed secret storage. It never opens outbound network
//! connections of its own.

use keyring::Entry;
use percent_encoding::percent_decode_str;
use tauri::http::{self, Response as HttpResponse};
use url::Url;

const KEYCHAIN_SERVICE: &str = "dev.nexine.app";

// ---------------------------------------------------------------------------
// Per-plugin CSP builder (mirrors @nexine/plugin-runtime buildPluginCsp)
// ---------------------------------------------------------------------------

/// Build a Content-Security-Policy string for a sandboxed plugin iframe.
///
/// `hosts` are the granted network origins (e.g. `["https://api.example.com"]`).
/// When empty, `connect-src 'none'` is produced (deny-by-default). The `nonce`
/// authorises the host's bootstrap `<script>` inside the sandbox document.
///
/// This function is `pub` so the integration tests can assert CSP correctness
/// without exercising the full Tauri protocol machinery.
pub fn build_plugin_csp(hosts: &[String], nonce: &str) -> String {
    let connect_src = if hosts.is_empty() {
        "connect-src 'none'".to_string()
    } else {
        format!("connect-src {}", hosts.join(" "))
    };

    [
        "default-src 'none'",
        &format!("script-src 'nonce-{}' blob:", nonce),
        "style-src 'unsafe-inline' blob:",
        "img-src 'self' data: blob:",
        "font-src 'self' data: blob:",
        "worker-src blob:",
        &connect_src,
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-src 'none'",
        "child-src 'none'",
    ]
    .join("; ")
}

// ---------------------------------------------------------------------------
// nexine-sandbox:// protocol handler
// ---------------------------------------------------------------------------

/// Parse query parameters from a URL. Returns the value of the first occurrence
/// of the given key, or `None` if absent.
fn query_param(url: &Url, key: &str) -> Option<String> {
    url.query_pairs()
        .find(|(k, _)| k == key)
        .map(|(_, v)| v.into_owned())
}

/// Handle a request to the `nexine-sandbox` custom protocol.
///
/// URL format: `nexine-sandbox://plugin/<id>[/plugin-guest.js]?nonce=<n>[&hosts=<csv>]`
///
/// - Requests ending in `/plugin-guest.js` serve the guest runtime script.
/// - All other requests serve the sandbox HTML document.
/// - Both responses carry a `Content-Security-Policy` header computed from the
///   query parameters (nonce + comma-separated granted hosts).
fn handle_sandbox_request(
    app: &tauri::AppHandle,
    request: http::Request<Vec<u8>>,
) -> HttpResponse<Vec<u8>> {
    let url = match Url::parse(request.uri().to_string().as_str()) {
        Ok(u) => u,
        Err(_) => return error_response(400, "invalid URL"),
    };

    let nonce = query_param(&url, "nonce").unwrap_or_default();
    let hosts: Vec<String> = query_param(&url, "hosts")
        .map(|raw| {
            percent_decode_str(&raw)
                .decode_utf8_lossy()
                .split(',')
                .filter(|h| !h.is_empty())
                .map(String::from)
                .collect()
        })
        .unwrap_or_default();

    let csp = build_plugin_csp(&hosts, &nonce);
    let path = url.path();

    if path.ends_with("/plugin-guest.js") || path == "/plugin-guest.js" {
        serve_frontend_file(app, "plugin-guest.js", "application/javascript", &csp)
    } else {
        serve_frontend_file(app, "sandbox.html", "text/html", &csp)
    }
}

/// Read a file from the bundled frontend dist and return it as an HTTP response
/// with the given content type and CSP header.
fn serve_frontend_file(
    app: &tauri::AppHandle,
    filename: &str,
    content_type: &str,
    csp: &str,
) -> HttpResponse<Vec<u8>> {
    // Tauri 2 resolves the frontend dist directory relative to the app bundle.
    // `resolve_resource` finds files declared in `frontendDist`.
    let resource_path = app
        .path()
        .resolve(filename, tauri::path::BaseDirectory::Resource);

    let body = match resource_path {
        Ok(path) => match std::fs::read(&path) {
            Ok(bytes) => bytes,
            Err(e) => {
                return error_response(
                    500,
                    &format!("failed to read {}: {}", filename, e),
                )
            }
        },
        Err(e) => {
            return error_response(
                500,
                &format!("failed to resolve {}: {}", filename, e),
            )
        }
    };

    HttpResponse::builder()
        .status(200)
        .header("Content-Type", format!("{}; charset=utf-8", content_type))
        .header("Content-Security-Policy", csp)
        .body(body)
        .unwrap_or_else(|_| error_response(500, "response build failed"))
}

fn error_response(status: u16, message: &str) -> HttpResponse<Vec<u8>> {
    HttpResponse::builder()
        .status(status)
        .header("Content-Type", "text/plain; charset=utf-8")
        .body(message.as_bytes().to_vec())
        .unwrap()
}

// ---------------------------------------------------------------------------
// Tauri commands (keychain)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// App entry
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![secret_set, secret_get, secret_delete])
        .register_uri_scheme_protocol("nexine-sandbox", |ctx, request| {
            handle_sandbox_request(ctx.app_handle(), request)
        })
        .run(tauri::generate_context!())
        .expect("error while running Nexine");
}
