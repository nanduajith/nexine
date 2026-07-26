import { xmlToJson, jsonToXml } from '@nexine/tool-xml-json';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('Input...') });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    let mode: 'xml2json' | 'json2xml' = 'xml2json';
    const update = () => {
      try {
        out.value = mode === 'xml2json' ? xmlToJson(inp.value) : jsonToXml(inp.value);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Mode'),
          body: k.segmented(
            [
              { value: 'xml2json', label: ctx.t('XML to JSON') },
              { value: 'json2xml', label: ctx.t('JSON to XML') },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: ctx.t('Input'), body: inp, flush: true }),
          k.panel({
            title: ctx.t('Output'),
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
