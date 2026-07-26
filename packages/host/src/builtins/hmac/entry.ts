import { generateHmac, type HmacAlgorithm } from '@nexine/tool-hmac';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    let algo: HmacAlgorithm = 'SHA-256';
    const message = k.textarea({ placeholder: ctx.t('Message to hash...') });
    const secret = k.input({ placeholder: ctx.t('Secret key') });
    const out = k.textarea({ readOnly: true, placeholder: ctx.t('Result will appear here...') });
    out.classList.add('nx-mono');

    const update = async () => {
      const m = message.value;
      const s = secret.value;
      if (!m || !s) {
        out.value = '';
        out.classList.remove('nx-error');
        return;
      }
      try {
        out.value = await generateHmac(m, s, algo);
        out.classList.remove('nx-error');
      } catch (err) {
        out.value = String(err);
        out.classList.add('nx-error');
      }
    };

    message.addEventListener('input', () => void update());
    secret.addEventListener('input', () => void update());

    root.append(
      k.grid2(
        k.panel({
          title: ctx.t('Input'),
          body: k.stack(
            k.field(ctx.t('Message'), message),
            k.field(ctx.t('Secret'), secret),
            k.field(
              'Algorithm',
              k.segmented(
                [
                  { value: 'SHA-1', label: ctx.t('SHA-1') },
                  { value: 'SHA-256', label: ctx.t('SHA-256') },
                  { value: 'SHA-384', label: ctx.t('SHA-384') },
                  { value: 'SHA-512', label: ctx.t('SHA-512') },
                ] as const,
                algo,
                (v) => {
                  algo = v;
                  void update();
                },
              ),
            ),
          ),
        }),
        k.panel({
          title: ctx.t('HMAC (Hex)'),
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
