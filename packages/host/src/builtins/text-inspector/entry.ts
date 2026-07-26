import { inspectText } from '@nexine/tool-text-inspector';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: 'Text to inspect...' });
    const out = k.h('div', { class: 'nx-empty', style: 'padding:16px' }, 'Stats');
    const update = () => {
      const stats = inspectText(inp.value);
      out.className = '';
      out.innerHTML = '';
      out.append(k.table(Object.entries(stats).map(([k, v]) => [k, String(v)])));
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: 'Text', body: inp, flush: true }),
        k.panel({ title: 'Stats', body: out, flush: true }),
      ),
    );
  },
}));
