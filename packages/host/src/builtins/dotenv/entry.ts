import { envToJson, jsonToEnv } from '@nexine/tool-dotenv';

import { createApp, register } from '../_kit';

register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let mode: 'env2json' | 'json2env' = 'env2json';
    let input = 'DATABASE_URL=postgres://localhost:5432/app\nDEBUG=true\nGREETING="hello world"';

    const out = k.textarea({ readOnly: true, minHeight: 260 });
    const error = k.h('span', { class: 'nx-error' });
    const inputTa = k.textarea({
      value: input,
      minHeight: 260,
      oninput: (v) => {
        input = v;
        update();
      },
    });

    const inField = k.field('.env', inputTa);
    const outField = k.field('JSON', out, { action: k.copyButton(() => out.value) });
    outField.append(error);
    const inLabel = inField.querySelector('.nx-label') as HTMLElement;
    const outLabel = outField.querySelector('.nx-label') as HTMLElement;

    function update() {
      const result = mode === 'env2json' ? envToJson(input) : jsonToEnv(input);
      if (result.ok) {
        out.value = result.value;
        error.textContent = '';
      } else {
        out.value = '';
        error.textContent = result.error;
      }
      inputTa.placeholder = mode === 'env2json' ? '.env contents…' : 'JSON object…';
      inLabel.textContent = mode === 'env2json' ? '.env' : 'JSON';
      outLabel.textContent = mode === 'env2json' ? 'JSON' : '.env';
    }

    root.append(
      k.stack(
        k.row(
          true,
          k.segmented(
            [
              { value: 'env2json', label: '.env → JSON' },
              { value: 'json2env', label: 'JSON → .env' },
            ] as const,
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        ),
        k.grid2(inField, outField),
      ),
    );
    update();
  },
}));
