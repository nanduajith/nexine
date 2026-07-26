import { generateLorem } from '@nexine/tool-lorem-ipsum';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let count = 3;
    let units: 'paragraphs' | 'sentences' | 'words' = 'paragraphs';
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    const update = () => {
      out.value = generateLorem(count, units);
    };
    root.append(
      k.stack(
        k.panel({
          title: 'Options',
          body: k.row(
            true,
            k.field(
              'Count',
              k.h('input', {
                type: 'number',
                class: 'nx-input',
                value: String(count),
                oninput: (e: Event) => {
                  count = Number((e.target as HTMLInputElement).value);
                  update();
                },
              }),
            ),
            k.field(
              'Units',
              k.segmented(
                [
                  { value: 'paragraphs', label: 'Paragraphs' },
                  { value: 'sentences', label: 'Sentences' },
                  { value: 'words', label: 'Words' },
                ],
                units,
                (v) => {
                  units = v;
                  update();
                },
              ),
            ),
            k.button('Regenerate', { variant: 'primary', onClick: update }),
          ),
        }),
        k.panel({
          title: 'Output',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
    update();
  },
}));
