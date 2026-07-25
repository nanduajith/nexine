import { register } from '../_kit';

/**
 * A self-testing plugin: every check below runs *inside* this plugin's isolated,
 * CSP-locked iframe, proving the sandbox's guarantees at runtime. It deliberately
 * uses raw DOM (not the UI kit) so it exercises only the platform primitives.
 */
register((ctx) => ({
  async mount(root) {
    function row(label: string, ok: boolean, detail: string): HTMLElement {
      const el = document.createElement('div');
      el.style.cssText =
        'display:flex;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px solid rgba(148,163,184,0.14)';
      const dot = document.createElement('span');
      dot.textContent = ok ? '✓' : '✗';
      dot.style.cssText = `color:${ok ? '#3fb950' : '#f2555a'};font-weight:700;font-size:14px;width:14px`;
      const name = document.createElement('span');
      name.textContent = label;
      name.style.cssText = 'flex:1;font-size:13px';
      const note = document.createElement('span');
      note.textContent = detail;
      note.style.cssText = 'font:12px ui-monospace,SFMono-Regular,monospace;color:#98a2b3';
      el.append(dot, name, note);
      return el;
    }

    root.style.cssText =
      'font-family:system-ui,sans-serif;padding:4px 2px;color:var(--nx-fg,#e5e7eb)';
    const title = document.createElement('div');
    title.textContent = 'Sandboxed plugin self-test';
    title.style.cssText = 'font-weight:600;font-size:15px;margin-bottom:3px';
    const sub = document.createElement('div');
    sub.textContent = 'Every check below runs inside this plugin’s isolated, CSP-locked iframe.';
    sub.style.cssText = 'font-size:12px;color:#98a2b3;margin-bottom:12px';
    root.append(title, sub);

    // 1. Origin isolation: reading the host page's location must throw.
    let isolated = false;
    try {
      void window.parent.location.href;
    } catch {
      isolated = true;
    }
    root.append(
      row('Isolated from host origin', isolated, isolated ? 'parent unreadable' : 'LEAK'),
    );

    // 2. Network egress: no 'network' permission ⇒ CSP connect-src 'none'.
    let blocked = false;
    try {
      await fetch('https://example.com/probe', { mode: 'no-cors' });
    } catch {
      blocked = true;
    }
    root.append(
      row('Network egress blocked by CSP', blocked, blocked ? "connect-src 'none'" : 'LEAK'),
    );

    // 3. Host-brokered storage: this plugin WAS granted 'storage'.
    let storageOk = false;
    let storageNote = '';
    try {
      const stamp = String(Date.now());
      await ctx.host.storage.set('probe', stamp);
      storageOk = (await ctx.host.storage.get('probe')) === stamp;
      storageNote = 'set/get over RPC';
    } catch (e) {
      storageNote = (e as Error)?.message ?? String(e);
    }
    root.append(row('Host storage (granted)', storageOk, storageNote));

    // 4. Clipboard: NOT requested, so the broker must deny it.
    let clipDenied = false;
    try {
      await ctx.host.clipboard.readText();
    } catch {
      clipDenied = true;
    }
    root.append(
      row('Clipboard denied (not requested)', clipDenied, clipDenied ? 'denied by host' : 'LEAK'),
    );

    const foot = document.createElement('div');
    foot.textContent = `Granted permissions: ${ctx.permissions.map((p) => p.id).join(', ') || 'none'}`;
    foot.style.cssText = 'margin-top:14px;font:12px ui-monospace,monospace;color:#6a7381';
    root.append(foot);
  },
}));
