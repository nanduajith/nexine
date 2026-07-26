import { diffLines, type DiffLine } from '@nexine/tool-diff';

import { createApp, register } from '../_kit';

const ROW_STYLE =
  'display:grid;grid-template-columns:3ch 3ch 1ch 1fr;gap:8px;padding:1px 12px;font-family:var(--nx-mono);font-size:12.5px;white-space:pre-wrap;word-break:break-word';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let left = 'the quick brown fox\njumps over\nthe lazy dog';
    let right = 'the quick brown fox\nleaps over\nthe lazy dog\nand runs away';
    let trimWhitespace = false;
    let ignoreCase = false;

    const summary = k.h('div', { class: 'nx-row' });
    const rows = k.h('div');

    const leftTa = k.textarea({
      value: left,
      placeholder: ctx.t('Original…'),
      minHeight: 200,
      oninput: (v) => {
        left = v;
        update();
      },
    });
    const rightTa = k.textarea({
      value: right,
      placeholder: ctx.t('Changed…'),
      minHeight: 200,
      oninput: (v) => {
        right = v;
        update();
      },
    });

    function row(line: DiffLine): HTMLElement {
      const sign = line.op === 'add' ? '+' : line.op === 'remove' ? '-' : ' ';
      const color =
        line.op === 'add'
          ? 'var(--nx-success)'
          : line.op === 'remove'
            ? 'var(--nx-danger)'
            : 'var(--nx-fg)';
      const bg =
        line.op === 'add'
          ? 'color-mix(in srgb,var(--nx-success) 12%,transparent)'
          : line.op === 'remove'
            ? 'color-mix(in srgb,var(--nx-danger) 12%,transparent)'
            : 'transparent';
      return k.h(
        'div',
        { style: `${ROW_STYLE};background:${bg};color:${color}` },
        k.h('span', { class: 'nx-subtle' }, line.leftNumber?.toString() ?? ''),
        k.h('span', { class: 'nx-subtle' }, line.rightNumber?.toString() ?? ''),
        k.h('span', {}, sign),
        k.h('span', {}, line.text || ' '),
      );
    }

    function update() {
      const result = diffLines(left, right, { trimWhitespace, ignoreCase });
      summary.replaceChildren(
        k.badge(`+${result.summary.added}`, 'success'),
        k.badge(`-${result.summary.removed}`, 'danger'),
        k.badge(`${result.summary.unchanged} unchanged`, 'neutral'),
        result.identical ? k.badge(ctx.t('identical'), 'primary') : k.h('span'),
      );
      rows.replaceChildren();
      if (result.lines.length === 0) {
        rows.append(k.h('div', { class: 'nx-empty' }, 'Enter text on both sides to compare.'));
        return;
      }
      for (const line of result.lines) rows.append(row(line));
    }

    root.append(
      k.stack(
        k.grid2(k.field(ctx.t('Original'), leftTa), k.field(ctx.t('Changed'), rightTa)),
        k.row(
          false,
          k.switchToggle(
            trimWhitespace,
            (v) => {
              trimWhitespace = v;
              update();
            },
            'Ignore whitespace',
          ),
          k.switchToggle(
            ignoreCase,
            (v) => {
              ignoreCase = v;
              update();
            },
            'Ignore case',
          ),
        ),
        k.panel({ title: ctx.t('Difference'), actions: summary, body: rows, flush: true }),
      ),
    );
    update();
  },
}));
