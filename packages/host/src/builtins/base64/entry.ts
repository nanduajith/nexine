import { decodeBase64, encodeBase64 } from '@nexine/tool-base64';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'encode' | 'decode' = 'encode';
    let urlSafe = false;
    let input = '';

    const out = k.textarea({ readOnly: true, placeholder: 'Result appears here', minHeight: 240 });
    const err = k.h('span', { class: 'nx-error' });
    const inputTa = k.textarea({
      placeholder: 'Text to encode…',
      minHeight: 240,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      let value = '';
      let error = '';
      if (mode === 'encode') {
        value = encodeBase64(input, urlSafe);
      } else {
        const r = decodeBase64(input);
        if (r.ok) value = r.value;
        else error = r.error;
      }
      out.value = value;
      err.textContent = error;
      inputTa.placeholder = mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…';
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
            urlSafe,
            (v) => {
              urlSafe = v;
              update();
            },
            'URL-safe',
          ),
        ),
        k.grid2(k.field('Input', inputTa), outField),
      ),
    );
    update();
  },
}));
