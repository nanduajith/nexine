import { parseMarkdown } from '@nexine/tool-markdown';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('# Markdown') });
    const out = k.h('div', {
      class: 'nx-markdown',
      style: 'padding:16px;height:100%;overflow:auto',
    });
    const update = () => {
      out.innerHTML = parseMarkdown(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: ctx.t('Markdown'), body: inp, flush: true }),
        k.panel({ title: ctx.t('Preview'), body: out, flush: true }),
      ),
    );
  },
}));
