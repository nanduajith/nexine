//! Nexine desktop shell. The frontend is the same no-egress web app; the native
//! layer adds only what a browser cannot do: a global summon hotkey and
//! OS-keychain-backed secret storage. It never opens outbound network
//! connections of its own.

use keyring::Entry;
use percent_encoding::percent_decode_str;
use tauri::http::{self, Response as HttpResponse};
use tauri::Manager;
use url::Url;

const KEYCHAIN_SERVICE: &str = "dev.nexine.app";

// ---------------------------------------------------------------------------
// Per-plugin CSP builder (mirrors @nexine/plugin-runtime buildPluginCsp)
// ---------------------------------------------------------------------------

/// Build a Content-Security-Policy string for a sandboxed plugin iframe.
///
/// `hosts` are the granted network origins (e.g. `["https://api.example.com"]`).
/// When empty, `connect-src 'none'` is produced (deny-by-default). The bundled
/// guest loads same-origin (`'self'`) and the untrusted plugin runs as a `blob:`
/// module — mirroring `@nexine/plugin-runtime`'s `buildPluginCsp`. The document
/// served on this protocol carries no `<meta>` CSP, so this header alone governs it.
///
/// This function is `pub` so the integration tests can assert CSP correctness
/// without exercising the full Tauri protocol machinery.
pub fn build_plugin_csp(hosts: &[String]) -> String {
    let connect_src = if hosts.is_empty() {
        "connect-src 'none'".to_string()
    } else {
        format!("connect-src {}", hosts.join(" "))
    };

    [
        "default-src 'none'",
        "script-src 'self' blob:",
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

/// The sandbox document served on the `nexine-sandbox` protocol. It carries **no**
/// `<meta>` CSP — the per-plugin policy is applied as an HTTP header instead, so a
/// second (conflicting) policy never intersects it. The guest script is loaded
/// same-origin (authorised by `script-src 'self'`); it then runs the untrusted
/// plugin as a `blob:` module.
fn sandbox_html() -> &'static str {
    concat!(
        "<!doctype html><html><head><meta charset=\"utf-8\">",
        "<title>Nexine plugin sandbox</title></head>",
        "<body style=\"margin:0;background:transparent;color-scheme:dark\">",
        "<div id=\"nx-plugin-root\"></div>",
        "<script src=\"plugin-guest.js\"></script>",
        "</body></html>"
    )
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
/// URL format: `nexine-sandbox://plugin/<id>[/plugin-guest.js][?hosts=<csv>]`
///
/// - Requests ending in `/plugin-guest.js` serve the bundled guest runtime script.
/// - All other requests serve the (meta-CSP-free) sandbox HTML document.
/// - Both responses carry the per-plugin `Content-Security-Policy` header built
///   from the comma-separated granted hosts (`connect-src 'none'` when absent).
fn handle_sandbox_request(
    app: &tauri::AppHandle,
    request: http::Request<Vec<u8>>,
) -> HttpResponse<Vec<u8>> {
    let url = match Url::parse(request.uri().to_string().as_str()) {
        Ok(u) => u,
        Err(_) => return error_response(400, "invalid URL"),
    };

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

    let csp = build_plugin_csp(&hosts);
    let path = url.path();

    if path.ends_with("plugin-guest.js") {
        serve_guest_script(app, &csp)
    } else {
        HttpResponse::builder()
            .status(200)
            .header("Content-Type", "text/html; charset=utf-8")
            .header("Content-Security-Policy", csp)
            .body(sandbox_html().as_bytes().to_vec())
            .unwrap_or_else(|_| error_response(500, "response build failed"))
    }
}

/// Serve the bundled `plugin-guest.js` from the embedded frontend assets. Using the
/// asset resolver (not the OS resource dir) reads it straight from `frontendDist`,
/// which is where the guest runtime is emitted.
fn serve_guest_script(app: &tauri::AppHandle, csp: &str) -> HttpResponse<Vec<u8>> {
    match app.asset_resolver().get("/plugin-guest.js".to_string()) {
        Some(asset) => HttpResponse::builder()
            .status(200)
            .header("Content-Type", "application/javascript; charset=utf-8")
            .header("Content-Security-Policy", csp)
            .body(asset.bytes)
            .unwrap_or_else(|_| error_response(500, "response build failed")),
        None => error_response(404, "plugin-guest.js not found"),
    }
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
