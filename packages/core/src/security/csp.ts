/**
 * Content-Security-Policy is the backbone of Nexine's no-egress guarantee.
 *
 * In production the policy is deliberately strict: `connect-src 'none'` means the
 * application literally cannot open a network connection (fetch/XHR/WebSocket/
 * beacon) — there is no code path by which a user's pasted secret can leave the
 * machine. This is the single most important security control in the product and
 * is asserted by an automated test in CI.
 *
 * Development relaxes only what Vite's HMR needs (a localhost WebSocket + inline).
 * The relaxation never ships to users.
 */

export interface CspOptions {
  /** When true, emit the HMR-friendly development policy instead of the strict one. */
  readonly dev?: boolean;
  /**
   * When true (desktop build), allow the plugin iframe to load from the Tauri
   * `nexine-sandbox` custom protocol origin. The web build never sets this — it has
   * no plugins and no iframes, so `frame-src` stays `'self'`.
   */
  readonly desktop?: boolean;
}

type Directives = Record<string, readonly string[]>;

/**
 * The Tauri custom-protocol origins the desktop plugin sandbox is served from.
 * The scheme differs by platform: a custom scheme on macOS/iOS (`nexine-sandbox:`)
 * and an `http://<scheme>.localhost` origin on Windows/Linux. Both are added to
 * `frame-src` so the app document may embed the sandbox iframe.
 */
const DESKTOP_SANDBOX_FRAME_SRC = ['nexine-sandbox:', 'http://nexine-sandbox.localhost'];

const BASE_DIRECTIVES: Directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  // Style needs inline for design-token custom properties injected at runtime.
  // This is a low-risk allowance (styles cannot exfiltrate data) and is scoped
  // to style only — scripts remain 'self' with no unsafe-inline/eval.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  // The no-egress control: no outbound connections whatsoever in production.
  'connect-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
  'frame-ancestors': ["'none'"],
  // On desktop, plugins run in an opaque-origin iframe served from the
  // `nexine-sandbox` custom protocol (see the `desktop` option below); each iframe
  // carries its OWN strict per-plugin CSP (served as an HTTP header) that governs
  // its egress. `'self'` alone here; the desktop origins are appended when building
  // the desktop policy. Crucially this never loosens the app's own
  // `connect-src 'none'` — the no-egress guarantee stands.
  'frame-src': ["'self'"],
};

/**
 * Build the serialized CSP string for a `<meta http-equiv>` tag or an HTTP header.
 */
export function buildContentSecurityPolicy(options: CspOptions = {}): string {
  const directives: Directives = { ...BASE_DIRECTIVES };

  if (options.dev) {
    // Vite dev server + HMR: allow inline/eval for the dev runtime and a
    // localhost WebSocket for hot updates. Never used in the production bundle.
    directives['script-src'] = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
    directives['connect-src'] = ["'self'", 'ws:', 'wss:'];
    directives['frame-src'] = ["'self'", 'blob:'];
  }

  if (options.desktop) {
    // Desktop only: let the app embed the plugin sandbox iframe served from the
    // Tauri custom protocol. Does not touch connect-src — the app stays no-egress.
    const frameSrc = directives['frame-src'] ?? ["'self'"];
    directives['frame-src'] = [...frameSrc, ...DESKTOP_SANDBOX_FRAME_SRC];
  }

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/** The connect-src token that encodes "no network egress". Exposed for tests. */
export const NO_EGRESS_CONNECT_SRC = "connect-src 'none'";

/**
 * The CSP for the static plugin **sandbox document** (`sandbox.html`).
 *
 * Plugins load in an iframe pointed at this real, same-origin document — NOT a
 * `srcdoc`/`blob:`/`data:` document. A real-scheme document does not inherit the
 * app's strict `script-src 'self'`, so this policy alone governs it: the bundled
 * guest loads as `'self'`, the untrusted plugin runs as an in-memory `blob:`
 * script, and — crucially — `connect-src 'none'` denies the plugin every network
 * connection. The iframe's `sandbox="allow-scripts"` (no `allow-same-origin`) still
 * forces an opaque origin, so the plugin can touch neither the host DOM nor its
 * storage. `object-src`/`base-uri`/`form-action`/`frame-src` are all locked to
 * `'none'`; `default-src 'none'` denies anything not re-enabled below.
 */
export function buildSandboxDocumentCsp(): string {
  const directives: Directives = {
    'default-src': ["'none'"],
    // Bundled guest is same-origin ('self'); untrusted plugin code runs as blob:.
    'script-src': ["'self'", 'blob:'],
    // Plugin UI sets inline styles (cannot exfiltrate); a Worker may run from blob:.
    'style-src': ["'unsafe-inline'", 'blob:'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:', 'blob:'],
    'worker-src': ['blob:'],
    // The plugin gets no network at all from the static sandbox document.
    'connect-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-src': ["'none'"],
    'child-src': ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}
