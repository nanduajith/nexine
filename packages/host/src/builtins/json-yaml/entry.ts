import { convert, type Format } from '@nexine/tool-json-yaml';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let toFormat: Format = 'yaml';

    const input = k.textarea({ minHeight: 300, placeholder: 'Paste JSON or YAML here...' });
    const out = k.textarea({ minHeight: 300, readOnly: true });

    const update = () => {
      const val = input.value;
      if (!val.trim()) {
        out.value = '';
        out.classList.remove('nx-error');
        return;
      }
      try {
        out.value = convert(val, toFormat);
        out.classList.remove('nx-error');
      } catch (err) {
        out.value = String(err);
        out.classList.add('nx-error');
      }
    };

    input.addEventListener('input', update);

    root.append(
      k.grid2(
        k.panel({
          title: 'Input',
          actions: k.segmented(
            [
              { value: 'yaml', label: 'To YAML' },
              { value: 'json', label: 'To JSON' },
            ] as const,
            toFormat,
            (v) => {
              toFormat = v;
              update();
            },
          ),
          body: input,
          flush: true,
        }),
        k.panel({
          title: 'Output',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
