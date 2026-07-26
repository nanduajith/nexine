import { csvToJson, jsonToCsv } from '@nexine/tool-csv-json';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'csv2json' | 'json2csv' = 'csv2json';
    const inp = k.textarea({ placeholder: ctx.t('Input...') });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = mode === 'csv2json' ? csvToJson(inp.value) : jsonToCsv(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Mode'),
          body: k.segmented(
            [
              { value: 'csv2json', label: ctx.t('CSV to JSON') },
              { value: 'json2csv', label: ctx.t('JSON to CSV') },
            ],
            mode,
            (v) => {
              mode = v;
              inp.value = '';
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
