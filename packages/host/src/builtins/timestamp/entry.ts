import { describeTime, parseTimeInput, type TimeBreakdown } from '@nexine/tool-timestamp';

import { createApp, register } from '../_kit';

const ROWS: ReadonlyArray<readonly [keyof TimeBreakdown, string]> = [
  ['unixSeconds', 'Unix (seconds)'],
  ['unixMillis', 'Unix (ms)'],
  ['iso', 'ISO 8601'],
  ['utc', 'UTC'],
  ['local', 'Local'],
  ['relative', 'Relative'],
];

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let input = '';

    const err = k.h('span', { class: 'nx-error' });
    const tableHolder = k.h('div');
    const inputEl = k.input({
      placeholder: 'Unix seconds / ms or ISO 8601 — leave empty for now',
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      const r = parseTimeInput(input);
      err.textContent = input.trim() && !r.ok ? r.error : '';
      tableHolder.replaceChildren();
      if (!r.ok) return;
      const breakdown = describeTime(r.value);
      tableHolder.append(
        k.h(
          'div',
          {
            style:
              'border:1px solid var(--nx-border);border-radius:var(--nx-radius-lg);overflow:hidden',
          },
          k.table(
            ROWS.map(([key, label]) => {
              const value = String(breakdown[key]);
              return [
                k.h('span', { class: 'nx-muted' }, label),
                k.h('span', { class: 'nx-mono' }, value),
                k.copyButton(() => value),
              ];
            }),
          ),
        ),
      );
    }

    const now = k.button('Now', {
      variant: 'secondary',
      small: true,
      onClick: () => {
        input = String(Math.floor(Date.now() / 1000));
        inputEl.value = input;
        update();
      },
    });

    const field = k.field('Timestamp or date', inputEl, { action: now });
    field.append(err);
    root.append(k.stack(field, tableHolder));
    update();
  },
}));
