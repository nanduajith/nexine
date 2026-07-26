import { generateFakeData } from '@nexine/tool-fake-data';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const out = k.textarea({ readOnly: true, minHeight: 150 });
    let type: 'person' | 'address' | 'company' | 'creditCard' = 'person';
    const update = () => {
      out.value = generateFakeData(type);
    };
    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Options'),
          actions: k.button(ctx.t('Regenerate'), { variant: 'primary', onClick: update }),
          body: k.segmented(
            [
              { value: 'person', label: ctx.t('Person') },
              { value: 'address', label: ctx.t('Address') },
              { value: 'company', label: ctx.t('Company') },
              { value: 'creditCard', label: ctx.t('Credit Card') },
            ],
            type,
            (v) => {
              type = v;
              update();
            },
          ),
        }),
        k.panel({
          title: ctx.t('Generated'),
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
    update();
  },
}));
