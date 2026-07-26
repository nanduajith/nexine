import { convertTimezone } from '@nexine/tool-timezone';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: '2024-01-01T12:00:00Z' });
    const tz = k.input({ value: 'America/New_York' });
    const out = k.h('div', { class: 'nx-empty', style: 'padding:16px' }, 'Result');
    const update = () => {
      try {
        out.innerHTML = convertTimezone(inp.value, tz.value);
        out.className = '';
      } catch (e) {
        out.innerHTML = String(e);
        out.className = 'nx-error';
      }
    };
    inp.addEventListener('input', update);
    tz.addEventListener('input', update);
    root.append(
      k.panel({
        title: 'Timezone Converter',
        body: k.stack(k.field('Date', inp), k.field('Target Timezone', tz), out),
      }),
    );
  },
}));
