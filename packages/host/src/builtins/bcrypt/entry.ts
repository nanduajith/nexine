import { hash, verify } from '@nexine/tool-bcrypt';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    // Hash Mode
    let rounds = 10;
    const hashInput = k.input({ placeholder: ctx.t('Password to hash...') });
    const hashOutput = k.input({ placeholder: ctx.t('Generated hash will appear here...') });
    hashOutput.readOnly = true;
    hashOutput.classList.add('nx-mono');

    const updateHash = () => {
      const val = hashInput.value;
      if (!val) {
        hashOutput.value = '';
        return;
      }
      hashOutput.value = hash(val, rounds);
    };

    hashInput.addEventListener('input', updateHash);

    // Verify Mode
    const verifyInput = k.input({ placeholder: ctx.t('Password to verify...') });
    const verifyHashInput = k.input({ placeholder: ctx.t('Bcrypt hash to check against...') });
    verifyHashInput.classList.add('nx-mono');

    const verifyStatus = k.h(
      'div',
      { class: 'nx-empty', style: 'padding:16px;min-height:50px' },
      'Status',
    );

    const updateVerify = () => {
      const p = verifyInput.value;
      const h = verifyHashInput.value;
      if (!p || !h) {
        verifyStatus.className = 'nx-empty';
        verifyStatus.textContent = 'Enter both password and hash';
        return;
      }
      const match = verify(p, h);
      verifyStatus.className = match ? 'nx-badge is-success' : 'nx-badge is-danger';
      verifyStatus.textContent = match
        ? 'Match: Password is correct'
        : 'Mismatch: Password is wrong';
    };

    verifyInput.addEventListener('input', updateVerify);
    verifyHashInput.addEventListener('input', updateVerify);

    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Generate Hash'),
          body: k.stack(
            k.field(ctx.t('Password'), hashInput),
            k.row(
              false,
              k.h(
                'div',
                { style: 'width: 100px' },
                k.field(
                  'Rounds',
                  k.h('input', {
                    type: 'number',
                    class: 'nx-input',
                    value: String(rounds),
                    min: '4',
                    max: '31',
                    oninput: (e: Event) => {
                      rounds = Number((e.target as HTMLInputElement).value);
                      updateHash();
                    },
                  }),
                ),
              ),
              k.button(ctx.t('Regenerate'), { variant: 'primary', onClick: updateHash }),
            ),
            k.field(ctx.t('Output Hash'), hashOutput, {
              action: k.copyButton(() => hashOutput.value),
            }),
          ),
        }),
        k.panel({
          title: ctx.t('Verify Hash'),
          body: k.stack(
            k.field(ctx.t('Password'), verifyInput),
            k.field(ctx.t('Bcrypt Hash'), verifyHashInput),
            k.h(
              'div',
              { style: 'display:flex;align-items:center;justify-content:center' },
              verifyStatus,
            ),
          ),
        }),
      ),
    );
  },
}));
