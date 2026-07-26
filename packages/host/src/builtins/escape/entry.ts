import { escapeStr, unescapeStr } from '@nexine/tool-escape';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'escape' | 'unescape' = 'escape';
    const inp = k.textarea({ placeholder: 'Text...' });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = mode === 'escape' ? escapeStr(inp.value) : unescapeStr(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: 'Options',
          body: k.segmented(
            [
              { value: 'escape', label: 'Escape' },
              { value: 'unescape', label: 'Unescape' },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: 'Input', body: inp, flush: true }),
          k.panel({
            title: 'Result',
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
