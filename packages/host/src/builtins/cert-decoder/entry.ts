import { decodeCert } from '@nexine/tool-cert-decoder';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    const input = k.textarea({ placeholder: '-----BEGIN CERTIFICATE-----\\n...', minHeight: 300 });
    input.classList.add('nx-mono');

    const detailsWrap = k.h(
      'div',
      { class: 'nx-empty', style: 'padding:16px' },
      'Decoded details will appear here',
    );

    const renderTable = (obj: Record<string, string>) => {
      return k.table(
        Object.entries(obj).map(([key, val]) => [
          k.h('span', { class: 'nx-mono nx-subtle' }, key),
          k.h('span', { class: 'nx-break' }, val),
        ]),
      );
    };

    const update = () => {
      const val = input.value;
      if (!val.trim()) {
        detailsWrap.className = 'nx-empty';
        detailsWrap.innerHTML = 'Decoded details will appear here';
        return;
      }
      try {
        const info = decodeCert(val);
        detailsWrap.className = '';
        detailsWrap.innerHTML = '';

        detailsWrap.append(
          k.stack(
            k.h('div', { class: 'nx-label' }, 'Subject'),
            renderTable(info.subject),
            k.h('div', { class: 'nx-label', style: 'margin-top:16px' }, 'Issuer'),
            renderTable(info.issuer),
            k.h('div', { class: 'nx-label', style: 'margin-top:16px' }, 'Validity'),
            k.table([
              [
                k.h('span', { class: 'nx-mono nx-subtle' }, 'Not Before'),
                info.validFrom.toUTCString(),
              ],
              [
                k.h('span', { class: 'nx-mono nx-subtle' }, 'Not After'),
                info.validTo.toUTCString(),
              ],
            ]),
            k.h('div', { class: 'nx-label', style: 'margin-top:16px' }, 'Misc'),
            k.table([
              [
                k.h('span', { class: 'nx-mono nx-subtle' }, 'Serial Number'),
                k.h('span', { class: 'nx-mono nx-break' }, info.serialNumber),
              ],
              [
                k.h('span', { class: 'nx-mono nx-subtle' }, 'Signature OID'),
                k.h('span', { class: 'nx-mono' }, info.signatureOid),
              ],
            ]),
          ),
        );
      } catch (err) {
        detailsWrap.className = 'nx-error';
        detailsWrap.innerHTML = String(err);
      }
    };

    input.addEventListener('input', update);

    root.append(
      k.grid2(
        k.panel({
          title: 'PEM Certificate',
          body: input,
          flush: true,
        }),
        k.panel({
          title: 'Details',
          body: detailsWrap,
          flush: true,
        }),
      ),
    );
  },
}));
