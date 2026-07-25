/**
 * A minimal Nexine plugin. It runs inside an opaque-origin, `allow-scripts`
 * sandbox with a per-plugin CSP, and registers itself by calling the injected
 * global `nexine.definePlugin(...)` — no imports, no module loader, no eval.
 *
 * Types for the guest API live in `@nexine/sdk/guest`; here we keep the example
 * fully self-contained by declaring just the slice of the global we use, so the
 * bundle has zero external dependencies.
 */

interface HelloStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

interface HelloContext {
  host: { storage: HelloStorage };
}

interface HelloGlobal {
  definePlugin(def: {
    setup(ctx: HelloContext): { mount(root: HTMLElement): void; unmount?(): void };
  }): void;
}

declare const nexine: HelloGlobal;

nexine.definePlugin({
  setup(ctx) {
    return {
      mount(root) {
        root.style.cssText =
          'font:14px system-ui;padding:24px;color:#e5e7eb;background:#0d1017;min-height:100vh';

        const title = document.createElement('h1');
        title.textContent = 'Hello from a signed plugin 👋';
        title.style.cssText = 'font-size:18px;margin:0 0 12px';

        const note = document.createElement('p');
        note.style.cssText = 'color:#9ca3af;margin:0 0 16px';
        note.textContent =
          'Built with `nexine pack`, verified by signature, running fully sandboxed.';

        const counterLabel = document.createElement('div');
        const button = document.createElement('button');
        button.textContent = 'Increment (persisted via storage RPC)';
        button.style.cssText =
          'font:inherit;padding:8px 14px;border-radius:8px;border:1px solid #2a3140;background:#161b26;color:#e5e7eb;cursor:pointer';

        const KEY = 'count';
        const render = async () => {
          const raw = await ctx.host.storage.get(KEY);
          counterLabel.textContent = `count = ${raw ?? '0'}`;
        };
        counterLabel.style.cssText = 'margin:12px 0;font-variant-numeric:tabular-nums';

        button.addEventListener('click', async () => {
          const raw = await ctx.host.storage.get(KEY);
          const next = String((Number(raw ?? '0') || 0) + 1);
          await ctx.host.storage.set(KEY, next);
          await render();
        });

        root.append(title, note, counterLabel, button);
        void render();
      },
    };
  },
});
