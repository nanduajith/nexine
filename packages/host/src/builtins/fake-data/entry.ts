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
          title: 'Options',
          actions: k.button('Regenerate', { variant: 'primary', onClick: update }),
          body: k.segmented(
            [
              { value: 'person', label: 'Person' },
              { value: 'address', label: 'Address' },
              { value: 'company', label: 'Company' },
              { value: 'creditCard', label: 'Credit Card' },
            ],
            type,
            (v) => {
              type = v;
              update();
            },
          ),
        }),
        k.panel({
          title: 'Generated',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
    update();
  },
}));
