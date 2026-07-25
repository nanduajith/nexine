/**
 * The in-sandbox UI kit. Builtin plugins run in an opaque-origin iframe with no
 * access to the host's React or stylesheet, so this kit gives every builtin a
 * consistent, tokenized look with plain DOM — the same visual language as the
 * host, reproduced from the design tokens. It is bundled *into* each builtin, so
 * a builtin stays a fully self-contained plugin, identical in kind to any
 * side-loaded package.
 *
 * Nothing here reaches the network or the host DOM. Clipboard goes through the
 * host RPC bridge (`ctx.host.clipboard`); theme is received over a one-way
 * postMessage from the host (`nx:theme`) — no capability, no egress.
 */

import type { PluginContext, PluginDefinition, PluginInstance } from '@nexine/sdk/guest';

// The registration global installed by the guest bootstrap inside the sandbox.
declare const nexine: { definePlugin(def: PluginDefinition): void };

export type { PluginContext };

/** Register a builtin. Mirrors how any plugin author calls the global. */
export function register(
  setup: (ctx: PluginContext) => PluginInstance | Promise<PluginInstance>,
): void {
  nexine.definePlugin({ setup });
}

type Attrs = Record<string, unknown>;
type Child = Node | string | null | undefined | false;

/** Tiny hyperscript: `h('div', { class: 'x', onclick }, child, …)`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') el.className = String(value);
      else if (key === 'style') el.setAttribute('style', String(value));
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else if (key in el) {
        (el as unknown as Record<string, unknown>)[key] = value;
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  for (const child of children) {
    if (child == null || child === false) continue;
    el.append(child);
  }
  return el;
}

const STYLE = `
:root{
  --nx-radius:.5rem;--nx-radius-lg:.75rem;
  --nx-bg:#0b0d11;--nx-surface:#14171d;--nx-surface-2:#1b1f27;--nx-surface-3:#232833;
  --nx-border:#272d38;--nx-border-strong:#333b48;
  --nx-fg:#e7ebf2;--nx-fg-muted:#98a2b3;--nx-fg-subtle:#6a7381;
  --nx-primary:#7c8cff;--nx-primary-soft:rgba(124,140,255,.14);
  --nx-success:#3fb950;--nx-danger:#f2555a;--nx-warning:#d9a441;
  --nx-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --nx-sans:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
}
[data-theme='light']{
  --nx-bg:#fff;--nx-surface:#f7f8fa;--nx-surface-2:#eef0f4;--nx-surface-3:#e6e9ef;
  --nx-border:#e3e7ee;--nx-border-strong:#d3d9e2;
  --nx-fg:#171a21;--nx-fg-muted:#5a626f;--nx-fg-subtle:#868e9b;
  --nx-primary:#4f5bd5;--nx-primary-soft:rgba(79,91,213,.1);
  --nx-success:#1a7f37;--nx-danger:#cf222e;--nx-warning:#9a6700;
}
*{box-sizing:border-box}
html,body{background:var(--nx-bg);margin:0}
.nx-app{font-family:var(--nx-sans);color:var(--nx-fg);background:var(--nx-bg);padding:2px;font-size:14px;line-height:1.5}
.nx-stack{display:flex;flex-direction:column;gap:16px}
.nx-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.nx-spread{justify-content:space-between}
.nx-grid2{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:760px){.nx-grid2{grid-template-columns:1fr 1fr}}
.nx-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.nx-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--nx-fg-subtle)}
.nx-label-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:22px}
.nx-input,.nx-textarea{width:100%;background:var(--nx-surface);color:var(--nx-fg);border:1px solid var(--nx-border);
  border-radius:var(--nx-radius);padding:10px 12px;font-family:var(--nx-mono);font-size:13px;outline:none;resize:vertical}
.nx-input:focus,.nx-textarea:focus{border-color:var(--nx-primary);box-shadow:0 0 0 3px var(--nx-primary-soft)}
.nx-textarea[readonly],.nx-input[readonly]{background:var(--nx-surface-2)}
.nx-textarea::placeholder,.nx-input::placeholder{color:var(--nx-fg-subtle)}
.nx-seg{display:inline-flex;background:var(--nx-surface-2);border:1px solid var(--nx-border);border-radius:var(--nx-radius);padding:3px}
.nx-seg-btn{border:0;background:transparent;color:var(--nx-fg-muted);font:inherit;font-size:13px;padding:5px 12px;border-radius:6px;cursor:pointer}
.nx-seg-btn.is-active{background:var(--nx-surface);color:var(--nx-fg);box-shadow:0 1px 2px rgba(0,0,0,.25)}
.nx-switch{position:relative;width:36px;height:20px;border-radius:999px;background:var(--nx-surface-3);border:1px solid var(--nx-border);cursor:pointer;flex:none;transition:background .15s}
.nx-switch.is-on{background:var(--nx-primary);border-color:var(--nx-primary)}
.nx-switch-thumb{position:absolute;top:1px;left:1px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
.nx-switch.is-on .nx-switch-thumb{transform:translateX(16px)}
.nx-switch-label{display:inline-flex;align-items:center;gap:8px;color:var(--nx-fg-muted);font-size:13px;cursor:pointer}
.nx-btn{border:1px solid var(--nx-border);background:var(--nx-surface-2);color:var(--nx-fg);font:inherit;font-size:13px;font-weight:500;
  padding:7px 12px;border-radius:var(--nx-radius);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.nx-btn:hover{border-color:var(--nx-border-strong)}
.nx-btn.is-primary{background:var(--nx-primary);border-color:var(--nx-primary);color:#fff}
.nx-btn.is-ghost{background:transparent;border-color:transparent;color:var(--nx-fg-muted)}
.nx-btn.is-ghost:hover{background:var(--nx-surface-2);color:var(--nx-fg)}
.nx-btn.is-sm{padding:4px 10px;font-size:12px}
.nx-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid var(--nx-border);color:var(--nx-fg-muted)}
.nx-badge.is-primary{background:var(--nx-primary-soft);border-color:transparent;color:var(--nx-primary)}
.nx-badge.is-success{color:var(--nx-success);border-color:color-mix(in srgb,var(--nx-success) 40%,transparent)}
.nx-badge.is-danger{color:var(--nx-danger);border-color:color-mix(in srgb,var(--nx-danger) 40%,transparent)}
.nx-badge.is-warning{color:var(--nx-warning);border-color:color-mix(in srgb,var(--nx-warning) 40%,transparent)}
.nx-panel{border:1px solid var(--nx-border);border-radius:var(--nx-radius-lg);background:var(--nx-surface);overflow:hidden}
.nx-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-bottom:1px solid var(--nx-border)}
.nx-panel-title{font-size:13px;font-weight:600;color:var(--nx-fg)}
.nx-panel-desc{font-size:12px;color:var(--nx-fg-subtle)}
.nx-panel-body{padding:16px}
.nx-panel-body.is-flush{padding:0}
.nx-table{width:100%;border-collapse:collapse;font-size:13px}
.nx-table td,.nx-table th{padding:8px 16px;text-align:left;border-bottom:1px solid var(--nx-border);vertical-align:top}
.nx-table tr:last-child td{border-bottom:0}
.nx-table th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--nx-fg-subtle);font-weight:600}
.nx-mono{font-family:var(--nx-mono)}
.nx-muted{color:var(--nx-fg-muted)}
.nx-subtle{color:var(--nx-fg-subtle);font-size:12px}
.nx-error{color:var(--nx-danger);font-size:12px}
.nx-primaryfg{color:var(--nx-primary)}
.nx-break{word-break:break-all}
.nx-empty{padding:32px;text-align:center;color:var(--nx-fg-subtle);font-size:13px}
`;

let stylesInjected = false;
function injectStyles(doc: Document): void {
  if (stylesInjected) return;
  stylesInjected = true;
  doc.head.appendChild(h('style', {}, STYLE));
}

/** The bound toolkit returned by {@link createApp}. */
export interface Kit {
  readonly h: typeof h;
  stack(...children: Child[]): HTMLElement;
  row(spread: boolean, ...children: Child[]): HTMLElement;
  grid2(...children: Child[]): HTMLElement;
  field(label: string, control: Node, opts?: { error?: string; action?: Node }): HTMLElement;
  textarea(opts: {
    value?: string;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number;
    oninput?: (value: string) => void;
  }): HTMLTextAreaElement;
  input(opts: {
    value?: string;
    placeholder?: string;
    oninput?: (value: string) => void;
  }): HTMLInputElement;
  segmented<T extends string>(
    options: readonly { value: T; label: string }[],
    value: T,
    onChange: (value: T) => void,
  ): HTMLElement;
  switchToggle(checked: boolean, onChange: (v: boolean) => void, label: string): HTMLElement;
  button(
    label: string,
    opts?: { variant?: 'primary' | 'secondary' | 'ghost'; small?: boolean; onClick?: () => void },
  ): HTMLButtonElement;
  copyButton(getValue: () => string, opts?: { label?: string }): HTMLButtonElement;
  badge(text: string, tone?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral'): HTMLElement;
  panel(opts: {
    title: string;
    description?: string;
    actions?: Node;
    body: Node;
    flush?: boolean;
  }): HTMLElement;
  table(rows: (Node | string)[][], headers?: string[]): HTMLElement;
}

/**
 * Set up the sandbox document (styles + theme) and return a toolkit bound to the
 * plugin context (so clipboard actions route through the host bridge).
 */
export function createApp(root: HTMLElement, ctx: PluginContext): Kit {
  const doc = root.ownerDocument;
  injectStyles(doc);
  root.className = 'nx-app';

  // Theme comes one-way from the host; default to dark until it arrives.
  const applyTheme = (theme: string) => doc.documentElement.setAttribute('data-theme', theme);
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; theme?: string } | null;
    if (data && data.type === 'nx:theme' && typeof data.theme === 'string') applyTheme(data.theme);
  });
  // Ask the host for the current theme now that the listener is attached.
  window.parent.postMessage({ type: 'nx:theme-request' }, '*');

  // Report our content height so the host can size the iframe to fit (iframes
  // don't auto-size). One-way, no capability.
  const reportHeight = () =>
    window.parent.postMessage(
      { type: 'nx:height', height: Math.ceil(doc.documentElement.scrollHeight) },
      '*',
    );
  new ResizeObserver(reportHeight).observe(doc.body);
  requestAnimationFrame(reportHeight);

  const kit: Kit = {
    h,
    stack: (...children) => h('div', { class: 'nx-stack' }, ...children),
    row: (spread, ...children) =>
      h('div', { class: `nx-row${spread ? ' nx-spread' : ''}` }, ...children),
    grid2: (...children) => h('div', { class: 'nx-grid2' }, ...children),
    field: (label, control, opts) =>
      h(
        'div',
        { class: 'nx-field' },
        h(
          'div',
          { class: 'nx-label-row' },
          h('span', { class: 'nx-label' }, label),
          opts?.action ?? null,
        ),
        control,
        opts?.error ? h('span', { class: 'nx-error' }, opts.error) : null,
      ),
    textarea: (opts) => {
      const ta = h('textarea', {
        class: 'nx-textarea',
        placeholder: opts.placeholder ?? '',
        readOnly: opts.readOnly ?? false,
        spellcheck: false,
        style: `min-height:${opts.minHeight ?? 200}px`,
      });
      if (opts.value != null) ta.value = opts.value;
      if (opts.oninput) ta.addEventListener('input', () => opts.oninput?.(ta.value));
      return ta;
    },
    input: (opts) => {
      const inp = h('input', {
        class: 'nx-input',
        placeholder: opts.placeholder ?? '',
        spellcheck: false,
      });
      if (opts.value != null) inp.value = opts.value;
      if (opts.oninput) inp.addEventListener('input', () => opts.oninput?.(inp.value));
      return inp;
    },
    segmented: (options, value, onChange) => {
      let current = value;
      const wrap = h('div', { class: 'nx-seg', role: 'tablist' });
      const buttons = options.map((opt) => {
        const btn = h(
          'button',
          {
            type: 'button',
            class: `nx-seg-btn${opt.value === current ? ' is-active' : ''}`,
            onclick: () => {
              if (current === opt.value) return;
              current = opt.value;
              for (const b of buttons) b.classList.toggle('is-active', b === btn);
              onChange(opt.value);
            },
          },
          opt.label,
        );
        return btn;
      });
      for (const b of buttons) wrap.append(b);
      return wrap;
    },
    switchToggle: (checked, onChange, label) => {
      let on = checked;
      const track = h(
        'span',
        { class: `nx-switch${on ? ' is-on' : ''}`, role: 'switch' },
        h('span', { class: 'nx-switch-thumb' }),
      );
      const wrap = h(
        'label',
        {
          class: 'nx-switch-label',
          onclick: () => {
            on = !on;
            track.classList.toggle('is-on', on);
            onChange(on);
          },
        },
        track,
        label,
      );
      return wrap;
    },
    button: (label, opts) =>
      h(
        'button',
        {
          type: 'button',
          class: `nx-btn is-${opts?.variant ?? 'secondary'}${opts?.small ? ' is-sm' : ''}`,
          onclick: opts?.onClick,
        },
        label,
      ),
    copyButton: (getValue, opts) => {
      const label = opts?.label ?? 'Copy';
      const btn = h('button', { type: 'button', class: 'nx-btn is-ghost is-sm' }, label);
      btn.addEventListener('click', () => {
        const value = getValue();
        if (!value) return;
        void ctx.host.clipboard.writeText(value).then(
          () => {
            btn.textContent = 'Copied';
            setTimeout(() => (btn.textContent = label), 1200);
          },
          () => {
            btn.textContent = 'Failed';
            setTimeout(() => (btn.textContent = label), 1200);
          },
        );
      });
      return btn;
    },
    badge: (text, tone = 'neutral') => h('span', { class: `nx-badge is-${tone}` }, text),
    panel: (opts) =>
      h(
        'div',
        { class: 'nx-panel' },
        h(
          'div',
          { class: 'nx-panel-head' },
          h(
            'div',
            {},
            h('div', { class: 'nx-panel-title' }, opts.title),
            opts.description ? h('div', { class: 'nx-panel-desc' }, opts.description) : null,
          ),
          opts.actions ?? null,
        ),
        h('div', { class: `nx-panel-body${opts.flush ? ' is-flush' : ''}` }, opts.body),
      ),
    table: (rows, headers) =>
      h(
        'table',
        { class: 'nx-table' },
        headers ? h('thead', {}, h('tr', {}, ...headers.map((th) => h('th', {}, th)))) : null,
        h(
          'tbody',
          {},
          ...rows.map((cells) =>
            h('tr', {}, ...cells.map((c) => (c instanceof Node ? h('td', {}, c) : h('td', {}, c)))),
          ),
        ),
      ),
  };

  return kit;
}
