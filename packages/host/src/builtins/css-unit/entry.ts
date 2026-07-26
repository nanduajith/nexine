import { pxToRem, remToPx } from '@nexine/tool-css-unit';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let base = 16;
    const pxInp = k.input({ placeholder: ctx.t('px') });
    const remInp = k.input({ placeholder: ctx.t('rem') });
    pxInp.addEventListener('input', () => {
      remInp.value = pxToRem(pxInp.value, base);
    });
    remInp.addEventListener('input', () => {
      pxInp.value = remToPx(remInp.value, base);
    });
    root.append(
      k.panel({
        title: ctx.t('CSS Unit Converter'),
        body: k.stack(
          k.field(
            'Base Font Size (px)',
            k.h('input', {
              type: 'number',
              class: 'nx-input',
              value: '16',
              oninput: (e: Event) => {
                base = Number((e.target as HTMLInputElement).value);
                remInp.value = pxToRem(pxInp.value, base);
              },
            }),
          ),
          k.row(true, k.field(ctx.t('Pixels'), pxInp), k.field(ctx.t('Rem'), remInp)),
        ),
      }),
    );
  },
}));
