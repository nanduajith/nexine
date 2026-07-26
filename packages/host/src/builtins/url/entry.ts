import { decodeUrl, encodeUrl, parseQuery } from '@nexine/tool-url';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'encode' | 'decode' = 'encode';
    let component = true;
    let input = '';

    const out = k.textarea({ readOnly: true, minHeight: 200 });
    const err = k.h('span', { class: 'nx-error' });
    const paramsHolder = k.h('div');
    const inputTa = k.textarea({
      placeholder: 'Text or URL to encode…',
      minHeight: 200,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      let value = '';
      let error = '';
      if (mode === 'encode') {
        value = encodeUrl(input, component);
      } else {
        const r = decodeUrl(input, component);
        if (r.ok) value = r.value;
        else error = r.error;
      }
      out.value = value;
      err.textContent = error;
      inputTa.placeholder = mode === 'encode' ? 'Text or URL to encode…' : 'Percent-encoded text…';

      const params = parseQuery(input);
      paramsHolder.replaceChildren();
      if (params.length > 0) {
        paramsHolder.append(
          k.panel({
            title: 'Query parameters',
            description: `${params.length} detected`,
            flush: true,
            body: k.table(
              params.map((p) => [
                k.h('span', { class: 'nx-mono nx-primaryfg' }, p.key),
                k.h('span', { class: 'nx-mono nx-break' }, p.value),
              ]),
            ),
          }),
        );
      }
    }

    const outField = k.field('Output', out, { action: k.copyButton(() => out.value) });
    outField.append(err);

    root.append(
      k.stack(
        k.row(
          true,
          k.segmented(
            [
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ] as const,
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
          k.switchToggle(
            component,
            (v) => {
              component = v;
              update();
            },
            'Component (encodeURIComponent)',
          ),
        ),
        k.grid2(k.field('Input', inputTa), outField),
        paramsHolder,
      ),
    );
    update();
  },
}));
