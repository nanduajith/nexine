import { formatXml } from '@nexine/tool-xml-formatter';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: '<xml>...' });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    let min = false;
    const update = () => {
      try {
        out.value = formatXml(inp.value, min);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: 'Options',
          body: k.h(
            'label',
            {},
            k.h('input', {
              type: 'checkbox',
              onchange: (e: Event) => {
                min = (e.target as HTMLInputElement).checked;
                update();
              },
            }),
            ' Minify',
          ),
        }),
        k.grid2(
          k.panel({ title: 'Input XML', body: inp, flush: true }),
          k.panel({
            title: 'Output',
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
