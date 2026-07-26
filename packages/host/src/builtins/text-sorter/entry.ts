import { sortText } from '@nexine/tool-text-sorter';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('Lines of text...') });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    let rev = false,
      ded = false;
    const update = () => {
      out.value = sortText(inp.value, rev, ded);
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Options'),
          body: k.row(
            true,
            k.h(
              'label',
              {},
              k.h('input', {
                type: 'checkbox',
                onchange: (e: Event) => {
                  rev = (e.target as HTMLInputElement).checked;
                  update();
                },
              }),
              ' Reverse',
            ),
            k.h(
              'label',
              {},
              k.h('input', {
                type: 'checkbox',
                onchange: (e: Event) => {
                  ded = (e.target as HTMLInputElement).checked;
                  update();
                },
              }),
              ' Remove Duplicates',
            ),
          ),
        }),
        k.grid2(
          k.panel({ title: ctx.t('Input'), body: inp, flush: true }),
          k.panel({
            title: ctx.t('Sorted'),
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
