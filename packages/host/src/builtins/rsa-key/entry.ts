import { generateRsaKeys, type RsaLength } from '@nexine/tool-rsa-key';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    let length: RsaLength = 2048;
    let isGenerating = false;

    const pubOut = k.textarea({
      readOnly: true,
      placeholder: 'Public Key (PEM)...',
      minHeight: 180,
    });
    pubOut.classList.add('nx-mono');
    const privOut = k.textarea({
      readOnly: true,
      placeholder: 'Private Key (PEM)...',
      minHeight: 300,
    });
    privOut.classList.add('nx-mono');

    const generateBtn = k.button('Generate Key Pair', {
      variant: 'primary',
      onClick: () => void generate(),
    });

    const generate = async () => {
      if (isGenerating) return;
      isGenerating = true;
      generateBtn.textContent = 'Generating...';
      generateBtn.disabled = true;

      try {
        const { publicKey, privateKey } = await generateRsaKeys(length);
        pubOut.value = publicKey;
        privOut.value = privateKey;
      } catch (err) {
        pubOut.value = 'Error generating keys';
        privOut.value = String(err);
      } finally {
        isGenerating = false;
        generateBtn.textContent = 'Generate Key Pair';
        generateBtn.disabled = false;
      }
    };

    root.append(
      k.stack(
        k.panel({
          title: 'Options',
          body: k.row(
            true,
            k.field(
              'Key Size',
              k.segmented(
                [
                  { value: '1024', label: '1024-bit' },
                  { value: '2048', label: '2048-bit' },
                  { value: '4096', label: '4096-bit' },
                ] as const,
                String(length),
                (v) => {
                  length = Number(v) as RsaLength;
                },
              ),
            ),
            generateBtn,
          ),
        }),
        k.grid2(
          k.panel({
            title: 'Public Key',
            actions: k.copyButton(() => pubOut.value),
            body: pubOut,
            flush: true,
          }),
          k.panel({
            title: 'Private Key',
            actions: k.copyButton(() => privOut.value),
            body: privOut,
            flush: true,
          }),
        ),
      ),
    );

    void generate();
  },
}));
