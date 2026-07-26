import { HASH_ALGORITHMS, hashAll, WEAK_ALGORITHMS } from '@nexine/tool-hash';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let input = '';
    let token = 0;

    const values: Record<string, HTMLElement> = {};
    const rows = HASH_ALGORITHMS.map((algorithm) => {
      const value = k.h('code', { class: 'nx-mono nx-break', style: 'flex:1;font-size:13px' }, '');
      values[algorithm] = value;
      return k.h(
        'div',
        {
          class: 'nx-row',
          style:
            'gap:12px;border:1px solid var(--nx-border);border-radius:var(--nx-radius);padding:8px 12px;background:var(--nx-surface);flex-wrap:nowrap',
        },
        k.h(
          'div',
          { class: 'nx-row', style: 'width:112px;flex:none;gap:6px' },
          k.h(
            'span',
            { class: 'nx-mono nx-muted', style: 'font-size:12px;font-weight:500' },
            algorithm,
          ),
          WEAK_ALGORITHMS.has(algorithm) ? k.badge('legacy', 'warning') : null,
        ),
        value,
        k.copyButton(() => value.textContent ?? ''),
      );
    });

    const inputTa = k.textarea({
      placeholder: 'Text to hash…',
      minHeight: 160,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function update() {
      const mine = ++token;
      void hashAll(input).then((digests) => {
        if (mine !== token) return;
        for (const algorithm of HASH_ALGORITHMS) {
          values[algorithm]!.textContent = digests[algorithm];
        }
      });
    }

    root.append(
      k.stack(
        k.field('Input', inputTa),
        k.h('div', { class: 'nx-stack', style: 'gap:8px' }, ...rows),
      ),
    );
    update();
  },
}));
