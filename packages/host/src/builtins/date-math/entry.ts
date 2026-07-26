import { doDateMath } from '@nexine/tool-date-math';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: '2024-01-01' });
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
          title: 'Config',
          body: k.stack(
            k.field('Date', inp),
            k.row(
              true,
              k.field(
                'Operation',
                k.segmented(
                  [
                    { value: 'add', label: 'Add' },
                    { value: 'sub', label: 'Subtract' },
                  ],
                  op,
                  (v) => {
                    op = v;
                    update();
                  },
                ),
              ),
              k.field('Amount', amt),
              k.field(
                'Unit',
                k.segmented(
                  [
                    { value: 'days', label: 'Days' },
                    { value: 'months', label: 'Months' },
                    { value: 'years', label: 'Years' },
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
        k.panel({ title: 'Result', body: out, flush: true }),
      ),
    );
  },
}));
