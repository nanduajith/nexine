import { generateRandomBytes } from '@nexine/tool-random-bytes';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let bytes = 32;
    let enc: 'hex' | 'base64' = 'hex';
    const out = k.textarea({ readOnly: true, minHeight: 100 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = generateRandomBytes(bytes, enc);
    };
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Options'),
          body: k.row(
            true,
            k.field(
              'Bytes',
              k.h('input', {
                type: 'number',
                class: 'nx-input',
                value: String(bytes),
                oninput: (e: Event) => {
                  bytes = Number((e.target as HTMLInputElement).value);
                  update();
                },
              }),
            ),
            k.field(
              'Format',
              k.segmented(
                [
                  { value: 'hex', label: ctx.t('Hex') },
                  { value: 'base64', label: ctx.t('Base64') },
                ],
                enc,
                (v) => {
                  enc = v;
                  update();
                },
              ),
            ),
            k.button(ctx.t('Regenerate'), { variant: 'primary', onClick: update }),
          ),
        }),
        k.panel({
          title: ctx.t('Output'),
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
    update();
  },
}));
