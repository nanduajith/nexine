import { hexToText, textToHex } from '@nexine/tool-hex';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'encode' | 'decode' = 'encode';
    let input = '';

    const out = k.textarea({ readOnly: true, minHeight: 220 });
    const err = k.h('span', { class: 'nx-error' });
    const inputTa = k.textarea({
      placeholder: ctx.t('Text to encode…'),
      minHeight: 220,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      let value = '';
      let error = '';
      if (mode === 'encode') {
        value = textToHex(input);
      } else {
        const r = hexToText(input);
        if (r.ok) value = r.value;
        else error = r.error;
      }
      out.value = value;
      err.textContent = error;
      inputTa.placeholder = mode === 'encode' ? 'Text to encode…' : 'Hex bytes to decode…';
    }

    const outField = k.field(ctx.t('Output'), out, { action: k.copyButton(() => out.value) });
    outField.append(err);

    root.append(
      k.stack(
        k.segmented(
          [
            { value: 'encode', label: ctx.t('Text → Hex') },
            { value: 'decode', label: ctx.t('Hex → Text') },
          ] as const,
          mode,
          (v) => {
            mode = v;
            update();
          },
        ),
        k.grid2(k.field(ctx.t('Input'), inputTa), outField),
      ),
    );
    update();
  },
}));
