import { generateUuids } from '@nexine/tool-uuid';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
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
              { value: '1', label: ctx.t('1') },
              { value: '5', label: ctx.t('5') },
              { value: '10', label: ctx.t('10') },
            ] as const,
            count,
            (v) => {
              count = v;
              generate();
            },
          ),
          k.button(ctx.t('Regenerate'), { variant: 'primary', small: true, onClick: generate }),
        ),
        k.field(ctx.t('UUID v4'), out, {
          action: k.copyButton(() => out.value, { label: ctx.t('Copy all') }),
        }),
      ),
    );
    generate();
  },
}));
