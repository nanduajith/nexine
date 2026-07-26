import { parseUrl } from '@nexine/tool-url-parser';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('https://...') });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = JSON.stringify(parseUrl(inp.value), null, 2);
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: ctx.t('URL'), body: inp, flush: true }),
        k.panel({
          title: ctx.t('Parsed'),
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
