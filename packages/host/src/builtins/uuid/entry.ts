import { generateUuids } from '@nexine/tool-uuid';

import { createApp, register } from '../_kit';

register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let count: '1' | '5' | '10' = '5';

    const out = k.textarea({ readOnly: true, minHeight: 200 });
    const generate = () => {
      out.value = generateUuids(Number(count)).join('\n');
    };

    root.append(
      k.stack(
        k.row(
          false,
          k.segmented(
            [
              { value: '1', label: '1' },
              { value: '5', label: '5' },
              { value: '10', label: '10' },
            ] as const,
            count,
            (v) => {
              count = v;
              generate();
            },
          ),
          k.button('Regenerate', { variant: 'primary', small: true, onClick: generate }),
        ),
        k.field('UUID v4', out, { action: k.copyButton(() => out.value, { label: 'Copy all' }) }),
      ),
    );
    generate();
  },
}));
