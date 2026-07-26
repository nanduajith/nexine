import { CASE_FORMATS, CASE_LABELS, convertCase } from '@nexine/tool-case';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let input = '';

    const cells: Record<string, HTMLElement> = {};
    const tableEl = k.table(
      CASE_FORMATS.map((format) => {
        const value = k.h('span', { class: 'nx-mono nx-break' }, '');
        cells[format] = value;
        return [
          k.h('span', { class: 'nx-muted' }, CASE_LABELS[format]),
          value,
          k.copyButton(() => value.textContent ?? ''),
        ];
      }),
    );

    const inputTa = k.textarea({
      placeholder: ctx.t('Type or paste text in any case…'),
      minHeight: 120,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      for (const format of CASE_FORMATS) cells[format]!.textContent = convertCase(input, format);
    }

    root.append(
      k.stack(
        k.field(ctx.t('Input'), inputTa),
        k.h(
          'div',
          {
            style:
              'border:1px solid var(--nx-border);border-radius:var(--nx-radius-lg);overflow:hidden',
          },
          tableEl,
        ),
      ),
    );
    update();
  },
}));
