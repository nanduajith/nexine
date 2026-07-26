import { formatGraphql } from '@nexine/tool-graphql';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: '{ query }' });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    const update = () => {
      try {
        out.value = formatGraphql(inp.value);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: 'Raw GraphQL', body: inp, flush: true }),
        k.panel({
          title: 'Formatted',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
