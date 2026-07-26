import { parseUA } from '@nexine/tool-user-agent';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('Mozilla/5.0...') });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = JSON.stringify(parseUA(inp.value), null, 2);
    };
    inp.addEventListener('input', update);
    root.append(k.panel({ title: ctx.t('User Agent Parser'), body: k.stack(inp, out) }));
  },
}));
