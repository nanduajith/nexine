import type { PluginManifest } from '@nexine/sdk';
import type { PluginInstance } from '@nexine/sdk/guest';
import { useEffect, useRef } from 'react';

import type { BuiltinSetup } from './builtin-tool';
import { createInProcessContext } from './in-process-host';

/**
 * Renders a first-party tool directly into the app DOM. The tool authors its UI
 * with the in-sandbox `_kit` (plain DOM), so we give it a mount root and an
 * in-process context, then call `setup` → `mount`. No iframe: first-party tools
 * are trusted and compiled into the bundle. Third-party plugins never take this
 * path — they are desktop-only and always sandboxed.
 */
export function BuiltinToolView({
  manifest,
  setup,
}: {
  manifest: PluginManifest;
  setup: BuiltinSetup;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let instance: PluginInstance | undefined;
    let disposed = false;

    void Promise.resolve(setup(createInProcessContext(manifest))).then((inst) => {
      if (disposed) return;
      instance = inst;
      void inst.mount(root);
    });

    return () => {
      disposed = true;
      instance?.unmount?.();
      root.replaceChildren();
    };
  }, [manifest, setup]);

  return <div ref={rootRef} />;
}
