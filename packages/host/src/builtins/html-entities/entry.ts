import { decodeHtml, encodeHtml } from '@nexine/tool-html-entities';

import { createApp, register } from '../_kit';

register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'encode' | 'decode' = 'encode';
    let input = '';

    const out = k.textarea({ readOnly: true, minHeight: 240 });
    const inputTa = k.textarea({
      placeholder: 'HTML/text to escape…',
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
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ] as const,
          mode,
          (v) => {
            mode = v;
            update();
          },
        ),
        k.grid2(
          k.field('Input', inputTa),
          k.field('Output', out, { action: k.copyButton(() => out.value) }),
        ),
      ),
    );
    update();
  },
}));
