import { xmlToJson, jsonToXml } from '@nexine/tool-xml-json';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: 'Input...' });
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
          title: 'Mode',
          body: k.segmented(
            [
              { value: 'xml2json', label: 'XML to JSON' },
              { value: 'json2xml', label: 'JSON to XML' },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: 'Input', body: inp, flush: true }),
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
