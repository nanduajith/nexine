import { csvToJson, jsonToCsv } from '@nexine/tool-csv-json';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'csv2json' | 'json2csv' = 'csv2json';
    const inp = k.textarea({ placeholder: 'Input...' });
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = mode === 'csv2json' ? csvToJson(inp.value) : jsonToCsv(inp.value);
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: 'Mode',
          body: k.segmented(
            [
              { value: 'csv2json', label: 'CSV to JSON' },
              { value: 'json2csv', label: 'JSON to CSV' },
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
