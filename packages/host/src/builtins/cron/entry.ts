import { nextRuns, parseCron } from '@nexine/tool-cron';

import { createApp, register } from '../_kit';

const PRESETS = ['*/15 * * * *', '0 9 * * mon-fri', '0 0 1 * *', '@daily', '@hourly'];

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let input = '*/15 * * * *';

    const summary = k.h('div', { class: 'nx-mono' });
    const error = k.h('span', { class: 'nx-error' });
    const runsBody = k.h('div');

    const field = k.input({
      value: input,
      placeholder: ctx.t('e.g. 0 9 * * mon-fri'),
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      runsBody.replaceChildren();
      const parsed = parseCron(input);
      if (!parsed.ok) {
        summary.textContent = '';
        error.textContent = parsed.error;
        return;
      }
      error.textContent = '';
      summary.textContent = parsed.value.description;

      const upcoming = nextRuns(parsed.value, new Date(), 5);
      if (upcoming.length === 0) {
        runsBody.append(k.h('div', { class: 'nx-empty' }, 'No runs in the next 5 years.'));
        return;
      }
      runsBody.append(
        k.table(
          upcoming.map((d) => [
            k.h('span', { class: 'nx-mono' }, d.toISOString().replace('.000Z', 'Z')),
            k.h('span', { class: 'nx-muted' }, d.toUTCString()),
          ]),
          ['ISO 8601 (UTC)', 'Readable (UTC)'],
        ),
      );
    }

    const presetRow = k.row(
      false,
      k.h('span', { class: 'nx-subtle' }, 'Presets:'),
      ...PRESETS.map((p) =>
        k.button(p, {
          variant: 'ghost',
          small: true,
          onClick: () => {
            input = p;
            field.value = p;
            update();
          },
        }),
      ),
    );

    root.append(
      k.stack(
        k.field(ctx.t('Cron expression'), field, { action: k.copyButton(() => input) }),
        presetRow,
        k.panel({
          title: ctx.t('What it means'),
          body: k.stack(summary, error),
        }),
        k.panel({ title: ctx.t('Next 5 runs'), body: runsBody, flush: true }),
      ),
    );
    update();
  },
}));
