import { evaluateJsonPath } from '@nexine/tool-jsonpath';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const json = k.textarea({ placeholder: ctx.t('JSON...') });
    json.classList.add('nx-mono');
    const query = k.input({ placeholder: ctx.t('$.store.book[*].author') });
    query.classList.add('nx-mono');
    const out = k.textarea({ readOnly: true, minHeight: 200 });
    out.classList.add('nx-mono');
    const update = () => {
      out.value = evaluateJsonPath(json.value, query.value);
    };
    json.addEventListener('input', update);
    query.addEventListener('input', update);
    root.append(
      k.stack(
        k.panel({ title: ctx.t('JSONPath Query'), body: query }),
        k.grid2(
          k.panel({ title: ctx.t('JSON'), body: json, flush: true }),
          k.panel({
            title: ctx.t('Matches'),
            actions: k.copyButton(() => out.value),
            body: out,
            flush: true,
          }),
        ),
      ),
    );
  },
}));
