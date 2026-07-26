import { lookupMime } from '@nexine/tool-mime-type';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: '.json or application/json' });
    const out = k.h('div', { class: 'nx-empty', style: 'padding:16px' }, 'Result');
    const update = () => {
      if (!inp.value) {
        out.innerHTML = 'Result';
        return;
      }
      out.innerHTML = `<span class="nx-mono">${lookupMime(inp.value)}</span>`;
    };
    inp.addEventListener('input', update);
    root.append(
      k.panel({ title: 'MIME Lookup', body: k.stack(k.field('Extension or MIME Type', inp), out) }),
    );
  },
}));
