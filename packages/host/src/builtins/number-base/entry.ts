import { convert, type Base } from '@nexine/tool-number-base';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let fromBase: Base = 10;

    const input = k.input({ placeholder: ctx.t('Enter a number...') });
    input.classList.add('nx-mono');

    const bases: { label: string; value: Base; prefix: string }[] = [
      { label: ctx.t('Binary (Base 2)'), value: 2, prefix: '0b' },
      { label: ctx.t('Octal (Base 8)'), value: 8, prefix: '0o' },
      { label: ctx.t('Decimal (Base 10)'), value: 10, prefix: '' },
      { label: ctx.t('Hexadecimal (Base 16)'), value: 16, prefix: '0x' },
    ];

    const outputMap = new Map<Base, { container: HTMLElement; setValue: (val: string) => void }>();
    const errorNode = k.h('div', { class: 'nx-error', style: 'margin-top:12px' });
    errorNode.style.display = 'none';

    const update = () => {
      const val = input.value;
      if (!val.trim()) {
        errorNode.style.display = 'none';
        for (const { value } of bases) {
          const out = outputMap.get(value);
          if (out) out.setValue('');
        }
        return;
      }
      try {
        for (const { value } of bases) {
          const out = outputMap.get(value);
          if (out) out.setValue(convert(val, fromBase, value));
        }
        errorNode.style.display = 'none';
      } catch (err) {
        errorNode.textContent = String(err);
        errorNode.style.display = 'block';
      }
    };

    input.addEventListener('input', update);

    const baseSelect = k.h(
      'select',
      { class: 'nx-input' },
      ...bases.map((b) => k.h('option', { value: String(b.value) }, b.label)),
    );
    baseSelect.value = String(fromBase);
    baseSelect.addEventListener('change', (e) => {
      fromBase = Number((e.target as HTMLSelectElement).value) as Base;
      update();
    });

    const panels = bases.map((b) => {
      let currentVal = '';
      const textContainer = k.h('div', {
        class: 'nx-mono nx-break',
        style: 'padding:16px;min-height:80px',
      });
      outputMap.set(b.value, {
        container: textContainer,
        setValue: (val) => {
          currentVal = val ? `${b.prefix}${val}` : '';
          textContainer.textContent = currentVal || 'Empty';
          textContainer.classList.toggle('nx-subtle', !currentVal);
        },
      });
      return k.panel({
        title: b.label,
        actions: k.copyButton(() => currentVal),
        body: textContainer,
        flush: true,
      });
    });

    root.append(
      k.stack(
        k.panel({
          title: ctx.t('Input'),
          body: k.stack(
            k.row(
              false,
              k.h('div', { style: 'flex:1' }, k.field(ctx.t('Value'), input)),
              k.h('div', { style: 'width:200px' }, k.field(ctx.t('From Base'), baseSelect)),
            ),
            errorNode,
          ),
        }),
        k.grid2(...panels),
      ),
    );

    update();
  },
}));
