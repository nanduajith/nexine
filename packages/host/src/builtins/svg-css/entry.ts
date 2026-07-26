import { svgToCss } from '@nexine/tool-svg-css';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: '<svg>...</svg>' });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = svgToCss(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.grid2(
        k.panel({ title: 'Raw SVG', body: inp, flush: true }),
        k.panel({
          title: 'CSS Background',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
