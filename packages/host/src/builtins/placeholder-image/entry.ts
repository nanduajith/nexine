import { generatePlaceholder } from '@nexine/tool-placeholder-image';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const w = 400,
      h = 300;
    const txt = k.input({ value: 'Placeholder' });
    const bg = k.h('input', { type: 'color', value: '#cccccc' }) as HTMLInputElement;
    const fg = k.h('input', { type: 'color', value: '#333333' }) as HTMLInputElement;
    const out = k.input({});
    out.readOnly = true;
    const img = k.h('img', { style: 'max-width:100%;max-height:300px' }) as HTMLImageElement;
    const update = () => {
      const src = generatePlaceholder(w, h, txt.value, bg.value, fg.value);
      out.value = src;
      img.src = src;
    };
    [txt, bg, fg].forEach((el) => el.addEventListener('input', update));
    root.append(
      k.stack(
        k.panel({
          title: 'Config',
          body: k.row(true, k.field('Text', txt), k.field('BG', bg), k.field('FG', fg)),
        }),
        k.panel({ title: 'Preview', body: k.stack(img, out) }),
      ),
    );
    update();
  },
}));
