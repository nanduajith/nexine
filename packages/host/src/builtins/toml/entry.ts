import { tomlToJson, jsonToToml } from '@nexine/tool-toml';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.textarea({ placeholder: ctx.t('Input...') });
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
          title: ctx.t('Mode'),
          body: k.segmented(
            [
              { value: 'toml2json', label: ctx.t('TOML to JSON') },
              { value: 'json2toml', label: ctx.t('JSON to TOML') },
            ],
            mode,
            (v) => {
              mode = v;
              update();
            },
          ),
        }),
        k.grid2(
          k.panel({ title: ctx.t('Input'), body: inp, flush: true }),
          k.panel({
            title: ctx.t('Output'),
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
