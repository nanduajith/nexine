import { decrypt, encrypt } from '@nexine/tool-aes';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    let mode: 'encrypt' | 'decrypt' = 'encrypt';

    const input = k.textarea({ placeholder: ctx.t('Text to encrypt...') });
    const passInput = k.input({ placeholder: ctx.t('Passphrase') });
    const out = k.textarea({ readOnly: true, placeholder: ctx.t('Result will appear here...') });
    out.classList.add('nx-mono');

    const update = async () => {
      const val = input.value;
      const pass = passInput.value;
      if (!val || !pass) {
        out.value = '';
        out.classList.remove('nx-error');
        return;
      }

      try {
        if (mode === 'encrypt') {
          out.value = await encrypt(val, pass);
        } else {
          out.value = await decrypt(val, pass);
        }
        out.classList.remove('nx-error');
      } catch (err) {
        out.value = String(err);
        out.classList.add('nx-error');
      }
    };

    input.addEventListener('input', () => void update());
    passInput.addEventListener('input', () => void update());

    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Input'),
          actions: k.segmented(
            [
              { value: 'encrypt', label: ctx.t('Encrypt') },
              { value: 'decrypt', label: ctx.t('Decrypt') },
            ] as const,
            mode,
            (v) => {
              mode = v;
              input.placeholder =
                mode === 'encrypt' ? 'Text to encrypt...' : 'Base64 ciphertext to decrypt...';
              void update();
            },
          ),
          body: k.stack(k.field(ctx.t('Passphrase'), passInput), input),
        }),
        k.panel({
          title: ctx.t('Output'),
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
  },
}));
