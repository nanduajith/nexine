import { parseIso } from '@nexine/tool-iso8601';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: ctx.t('2024-01-01T12:00:00Z') });
    const out = k.h('div', { class: 'nx-empty', style: 'padding:16px' }, 'Enter ISO');
    const update = () => {
      try {
        const p = parseIso(inp.value);
        out.className = '';
        out.innerHTML = '';
        out.append(k.table(Object.entries(p).map(([k, v]) => [k, v])));
      } catch (e) {
        out.className = 'nx-error';
        out.innerHTML = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.panel({
        title: ctx.t('ISO Parser'),
        body: k.stack(k.field(ctx.t('ISO String'), inp), out),
      }),
    );
  },
}));
