import { decodeHtml, encodeHtml } from '@nexine/tool-html-entities';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'encode' | 'decode' = 'encode';
    let input = '';

    const out = k.textarea({ readOnly: true, minHeight: 240 });
    const inputTa = k.textarea({
      placeholder: ctx.t('HTML/text to escape…'),
      minHeight: 240,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      out.value = mode === 'encode' ? encodeHtml(input) : decodeHtml(input);
      inputTa.placeholder = mode === 'encode' ? 'HTML/text to escape…' : 'Text with &entities; …';
    }

    root.append(
      k.stack(
        k.segmented(
          [
            { value: 'encode', label: ctx.t('Encode') },
            { value: 'decode', label: ctx.t('Decode') },
          ] as const,
          mode,
          (v) => {
            mode = v;
            update();
          },
        ),
        k.grid2(
          k.field(ctx.t('Input'), inputTa),
          k.field(ctx.t('Output'), out, { action: k.copyButton(() => out.value) }),
        ),
      ),
    );
    update();
  },
}));
