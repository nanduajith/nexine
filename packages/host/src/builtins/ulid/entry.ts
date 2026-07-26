import { generateUlid } from '@nexine/tool-ulid';

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
      out.value = generateUlid();
    };
    root.append(
      k.stack(
        k.panel({
          title: 'ULID',
          actions: k.copyButton(() => out.value),
          body: k.stack(out, k.button('Regenerate', { variant: 'primary', onClick: update })),
        }),
      ),
    );
    update();
  },
}));
