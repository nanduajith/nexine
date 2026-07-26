import { formatSql } from '@nexine/tool-sql-formatter';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: 'SELECT * FROM...' });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    const update = () => {
      try {
        out.value = formatSql(inp.value);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: 'Raw SQL', body: inp, flush: true }),
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
