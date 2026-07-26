//! Integration tests for the `build_plugin_csp` helper.
//!
//! These validate that the Rust CSP builder produces output matching the
//! TypeScript `buildPluginCsp` function's contract. The tests do NOT exercise
//! the full Tauri protocol machinery — they call the CSP builder directly.
//!
//! Run in CI under `xvfb-run` (required by Tauri's WebKitGTK dependency on
//! Linux even for non-UI tests).

use nexine_lib::build_plugin_csp;

#[test]
fn no_hosts_produces_connect_src_none() {
    let csp = build_plugin_csp(&[]);
    assert!(
        csp.contains("connect-src 'none'"),
        "expected connect-src 'none' in: {csp}"
    );
}

#[test]
fn single_host_in_connect_src() {
    let csp = build_plugin_csp(&["https://api.example.com".to_string()]);
    assert!(
        csp.contains("connect-src https://api.example.com"),
        "expected connect-src with single host in: {csp}"
    );
    assert!(
        !csp.contains("connect-src 'none'"),
        "should not contain connect-src 'none' when hosts are provided: {csp}"
    );
}

#[test]
fn multiple_hosts_in_connect_src() {
    let csp = build_plugin_csp(&[
        "https://api.example.com".to_string(),
        "https://cdn.example.com".to_string(),
    ]);
    assert!(
        csp.contains("connect-src https://api.example.com https://cdn.example.com"),
        "expected connect-src with multiple hosts in: {csp}"
    );
}

#[test]
fn never_contains_unsafe_eval() {
    let csp_none = build_plugin_csp(&[]);
    let csp_hosts = build_plugin_csp(&["https://x.com".to_string()]);
    assert!(
        !csp_none.contains("unsafe-eval"),
        "CSP must never contain unsafe-eval: {csp_none}"
    );
    assert!(
        !csp_hosts.contains("unsafe-eval"),
        "CSP must never contain unsafe-eval: {csp_hosts}"
    );
}

#[test]
fn guest_loads_as_self_plugin_as_blob() {
    let csp = build_plugin_csp(&[]);
    assert!(
        csp.contains("script-src 'self' blob:"),
        "expected script-src 'self' blob: in: {csp}"
    );
    assert!(
        !csp.contains("nonce-"),
        "per-plugin CSP no longer uses a nonce: {csp}"
    );
}

#[test]
fn default_src_is_none() {
    let csp = build_plugin_csp(&[]);
    assert!(
        csp.contains("default-src 'none'"),
        "expected default-src 'none' in: {csp}"
    );
}

#[test]
fn contains_required_directives() {
    let csp = build_plugin_csp(&[]);
    let required = [
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-src 'none'",
        "child-src 'none'",
        "style-src 'unsafe-inline' blob:",
        "worker-src blob:",
    ];
    for directive in &required {
        assert!(csp.contains(directive), "missing '{directive}' in: {csp}");
    }
}
