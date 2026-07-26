import { generatePassword } from '@nexine/tool-password-gen';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let len = 16,
      lower = true,
      upper = true,
      num = true,
      sym = true;
    const out = (() => {
      const i = k.input({});
      i.readOnly = true;
      return i;
    })();
    out.classList.add('nx-mono');
    const update = () => {
      out.value = generatePassword(len, lower, upper, num, sym);
    };

    root.append(
      k.stack(
        k.panel({
          title: 'Options',
          body: k.stack(
            k.field(
              'Length',
              k.h('input', {
                type: 'number',
                class: 'nx-input',
                value: String(len),
                min: '4',
                max: '128',
                oninput: (e: Event) => {
                  len = Number((e.target as HTMLInputElement).value);
                  update();
                },
              }),
            ),
            k.row(
              true,
              k.h(
                'label',
                {},
                k.h('input', {
                  type: 'checkbox',
                  checked: lower,
                  onchange: (e: Event) => {
                    lower = (e.target as HTMLInputElement).checked;
                    update();
                  },
                }),
                ' a-z',
              ),
              k.h(
                'label',
                {},
                k.h('input', {
                  type: 'checkbox',
                  checked: upper,
                  onchange: (e: Event) => {
                    upper = (e.target as HTMLInputElement).checked;
                    update();
                  },
                }),
                ' A-Z',
              ),
              k.h(
                'label',
                {},
                k.h('input', {
                  type: 'checkbox',
                  checked: num,
                  onchange: (e: Event) => {
                    num = (e.target as HTMLInputElement).checked;
                    update();
                  },
                }),
                ' 0-9',
              ),
              k.h(
                'label',
                {},
                k.h('input', {
                  type: 'checkbox',
                  checked: sym,
                  onchange: (e: Event) => {
                    sym = (e.target as HTMLInputElement).checked;
                    update();
                  },
                }),
                ' @#$',
              ),
            ),
            k.button('Regenerate', { variant: 'primary', onClick: update }),
          ),
        }),
        k.panel({
          title: 'Password',
          actions: k.copyButton(() => out.value),
          body: out,
          flush: true,
        }),
      ),
    );
    update();
  },
}));
