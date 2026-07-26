import { doDateMath } from '@nexine/tool-date-math';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: ctx.t('2024-01-01') });
    const amt = k.h('input', { type: 'number', value: '1', class: 'nx-input' }) as HTMLInputElement;
    let unit: 'days' | 'months' | 'years' = 'days';
    let op: 'add' | 'sub' = 'add';
    const out = k.textarea({ readOnly: true });
    const update = () => {
      try {
        out.value = doDateMath(inp.value, Number(amt.value), unit, op);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    amt.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Config'),
          body: k.stack(
            k.field(ctx.t('Date'), inp),
            k.row(
              true,
              k.field(
                'Operation',
                k.segmented(
                  [
                    { value: 'add', label: ctx.t('Add') },
                    { value: 'sub', label: ctx.t('Subtract') },
                  ],
                  op,
                  (v) => {
                    op = v;
                    update();
                  },
                ),
              ),
              k.field(ctx.t('Amount'), amt),
              k.field(
                'Unit',
                k.segmented(
                  [
                    { value: 'days', label: ctx.t('Days') },
                    { value: 'months', label: ctx.t('Months') },
                    { value: 'years', label: ctx.t('Years') },
                  ],
                  unit,
                  (v) => {
                    unit = v;
                    update();
                  },
                ),
              ),
            ),
          ),
        }),
        k.panel({ title: ctx.t('Result'), body: out, flush: true }),
      ),
    );
  },
}));
