import { generateNanoId } from '@nexine/tool-nanoid';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const out = (() => {
      const i = k.input({});
      i.readOnly = true;
      return i;
    })();
    out.classList.add('nx-mono');
    const update = () => {
      out.value = generateNanoId();
    };
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('NanoID'),
          actions: k.copyButton(() => out.value),
          body: k.stack(
            out,
            k.button(ctx.t('Regenerate'), { variant: 'primary', onClick: update }),
          ),
        }),
      ),
    );
    update();
  },
}));
