import { tomlToJson, jsonToToml } from '@nexine/tool-toml';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: 'Input...' });
    const out = k.textarea({ readOnly: true, minHeight: 300 });
    out.classList.add('nx-mono');
    let mode: 'toml2json' | 'json2toml' = 'toml2json';
    const update = () => {
      try {
        out.value = mode === 'toml2json' ? tomlToJson(inp.value) : jsonToToml(inp.value);
      } catch (e) {
        out.value = String(e);
      }
    };
    inp.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({
          title: 'Mode',
          body: k.segmented(
            [
              { value: 'toml2json', label: 'TOML to JSON' },
              { value: 'json2toml', label: 'JSON to TOML' },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: 'Input', body: inp, flush: true }),
          k.panel({
            title: 'Output',
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
