import { formatJson, minifyJson } from '@nexine/tool-json';

import { createApp, register } from '../_kit';

const INDENT: Record<string, number | '\t'> = { '2': 2, '4': 4, tab: '\t' };

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'beautify' | 'minify' = 'beautify';
    let indent: '2' | '4' | 'tab' = '2';
    let input = '';

    const out = k.textarea({
      readOnly: true,
      placeholder: 'Formatted JSON appears here',
      minHeight: 320,
    });
    const err = k.h('span', { class: 'nx-error' });
    const inputTa = k.textarea({
      placeholder: '{ "paste": "your JSON here" }',
      minHeight: 320,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    const indentSeg = k.segmented(
      [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
        { value: 'tab', label: 'Tabs' },
      ] as const,
      indent,
      (v) => {
        indent = v;
        update();
      },
    );

    function update() {
      const r = mode === 'beautify' ? formatJson(input, INDENT[indent]) : minifyJson(input);
      out.value = r.ok ? r.value : '';
      err.textContent = r.ok ? '' : r.error;
      indentSeg.style.display = mode === 'beautify' ? '' : 'none';
    }

    const inputField = k.field('Input', inputTa);
    inputField.append(err);

    root.append(
      k.stack(
        k.row(
          false,
          k.segmented(
            [
              { value: 'beautify', label: 'Beautify' },
              { value: 'minify', label: 'Minify' },
            ] as const,
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
          indentSeg,
        ),
        k.grid2(inputField, k.field('Output', out, { action: k.copyButton(() => out.value) })),
      ),
    );
    update();
  },
}));
