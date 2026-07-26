import { parseColor } from '@nexine/tool-color';

import { createApp, register } from '../_kit';

register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let input = '#7c8cff';

    const error = k.h('span', { class: 'nx-error' });
    const swatch = k.h('div', {
      style:
        'width:100%;height:88px;border-radius:var(--nx-radius-lg);border:1px solid var(--nx-border)',
    });
    const outputs = k.h('div');

    const field = k.input({
      value: input,
      placeholder: '#7c8cff, rgb(124 140 255), hsl(232 100% 74%)',
      oninput: (v) => {
        input = v;
        update();
      },
    });

    function outputRow(label: string, value: string): HTMLElement {
      const code = k.h('span', { class: 'nx-mono' }, value);
      return k.h(
        'div',
        {
          style:
            'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-bottom:1px solid var(--nx-border)',
        },
        k.h(
          'div',
          { style: 'display:flex;flex-direction:column;gap:2px;min-width:0' },
          k.h('span', { class: 'nx-label' }, label),
          code,
        ),
        k.copyButton(() => value),
      );
    }

    function update() {
      const result = parseColor(input);
      outputs.replaceChildren();
      if (!result.ok) {
        error.textContent = result.error;
        swatch.style.background = 'transparent';
        return;
      }
      error.textContent = '';
      swatch.style.background = result.value.rgbString;
      outputs.append(
        outputRow('HEX', result.value.hex),
        outputRow('RGB', result.value.rgbString),
        outputRow('HSL', result.value.hslString),
      );
    }

    root.append(
      k.stack(
        k.field('Color', field, { action: k.copyButton(() => input) }),
        error,
        swatch,
        k.panel({ title: 'Conversions', body: outputs, flush: true }),
      ),
    );
    update();
  },
}));
