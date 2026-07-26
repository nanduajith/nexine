import { escapeStr, unescapeStr } from '@nexine/tool-escape';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'escape' | 'unescape' = 'escape';
    const inp = k.textarea({ placeholder: ctx.t('Text...') });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = mode === 'escape' ? escapeStr(inp.value) : unescapeStr(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Options'),
          body: k.segmented(
            [
              { value: 'escape', label: ctx.t('Escape') },
              { value: 'unescape', label: ctx.t('Unescape') },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: ctx.t('Input'), body: inp, flush: true }),
          k.panel({
            title: ctx.t('Result'),
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
