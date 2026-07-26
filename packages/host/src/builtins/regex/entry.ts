import { runRegex } from '@nexine/tool-regex';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let pattern = '';
    let flags = 'g';
    let text = '';

    const err = k.h('span', { class: 'nx-error' });
    const matchesHolder = k.h('div');

    const patternInput = k.input({
      placeholder: ctx.t('\\d{3}-\\d{4}'),
      oninput: (v) => {
        pattern = v;
        update();
      },
    });
    const flagsInput = k.input({
      value: flags,
      placeholder: ctx.t('gim'),
      oninput: (v) => {
        flags = v;
        update();
      },
    });
    const textTa = k.textarea({
      placeholder: ctx.t('Text to search…'),
      minHeight: 180,
      oninput: (v) => {
        text = v;
        update();
      },
    });

    function update() {
      const r = runRegex(pattern, flags, text);
      const matches = r.ok ? r.value : [];
      err.textContent = r.ok ? '' : r.error;

      const body =
        matches.length === 0
          ? k.h('div', { class: 'nx-empty' }, 'No matches — adjust the pattern or test string.')
          : k.table(
              matches.map((m) => [
                k.h('span', { class: 'nx-subtle' }, String(m.index)),
                k.h('span', { class: 'nx-mono nx-primaryfg nx-break' }, m.match),
                k.h(
                  'span',
                  { class: 'nx-mono nx-muted nx-break' },
                  m.groups.length > 0 ? m.groups.map((g) => g ?? '∅').join(', ') : '—',
                ),
              ]),
              ['#', 'Match', 'Groups'],
            );

      matchesHolder.replaceChildren(
        k.panel({
          title: ctx.t('Matches'),
          description: r.ok ? `${matches.length} found` : 'Invalid pattern',
          flush: matches.length > 0,
          body,
        }),
      );
    }

    const patternField = k.field(ctx.t('Pattern'), patternInput);
    patternField.style.flex = '1';
    patternField.append(err);
    const flagsField = k.field(ctx.t('Flags'), flagsInput);
    flagsField.style.width = '112px';

    root.append(
      k.stack(
        k.h(
          'div',
          { class: 'nx-row', style: 'align-items:flex-start;flex-wrap:nowrap' },
          patternField,
          flagsField,
        ),
        k.field(ctx.t('Test string'), textTa),
        matchesHolder,
      ),
    );
    update();
  },
}));
