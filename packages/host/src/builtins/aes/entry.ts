import { decrypt, encrypt } from '@nexine/tool-aes';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    let mode: 'encrypt' | 'decrypt' = 'encrypt';

    const input = k.textarea({ placeholder: 'Text to encrypt...' });
    const passInput = k.input({ placeholder: 'Passphrase' });
    const out = k.textarea({ readOnly: true, placeholder: 'Result will appear here...' });
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
          title: 'Input',
          actions: k.segmented(
            [
              { value: 'encrypt', label: 'Encrypt' },
              { value: 'decrypt', label: 'Decrypt' },
            ] as const,
            mode,
            (v) => {
              mode = v;
              input.placeholder =
                mode === 'encrypt' ? 'Text to encrypt...' : 'Base64 ciphertext to decrypt...';
              void update();
            },
          ),
          body: k.stack(k.field('Passphrase', passInput), input),
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
