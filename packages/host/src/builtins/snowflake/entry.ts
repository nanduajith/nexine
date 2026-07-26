import { decodeSnowflake } from '@nexine/tool-snowflake';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: ctx.t('Snowflake ID...') });
    const epoch = k.input({ value: '1420070400000' });
    const out = k.h(
      'div',
      { class: 'nx-empty', style: 'padding:16px' },
      'Details will appear here',
    );
    const update = () => {
      if (!inp.value) {
        out.innerHTML = 'Enter ID';
        return;
      }
      try {
        const s = decodeSnowflake(inp.value, Number(epoch.value) || 1420070400000);
        out.innerHTML = '';
        out.append(
          k.table([
            ['Timestamp', s.timestamp.toISOString()],
            ['Worker ID', String(s.worker)],
            ['Process ID', String(s.process)],
            ['Increment', String(s.increment)],
          ]),
        );
      } catch (e) {
        out.innerHTML = String(e);
      }
    };
    inp.addEventListener('input', update);
    epoch.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Input'),
          body: k.stack(
            k.field(ctx.t('Snowflake'), inp),
            k.field(ctx.t('Epoch Offset (ms)'), epoch),
          ),
        }),
        k.panel({ title: ctx.t('Decoded'), body: out }),
      ),
    );
  },
}));
