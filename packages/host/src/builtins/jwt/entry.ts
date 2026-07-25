import { decodeJwt, isExpired, TIME_CLAIMS } from '@nexine/tool-jwt';

import { createApp, register } from '../_kit';

function claimTime(value: unknown): string | null {
  return typeof value === 'number' ? new Date(value * 1000).toLocaleString() : null;
}

register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    let token = '';

    const err = k.h('span', { class: 'nx-error' });
    const results = k.h('div', { class: 'nx-stack' });
    const tokenTa = k.textarea({
      placeholder: 'Paste a JWT (header.payload.signature)…',
      minHeight: 120,
      oninput: (v) => {
        token = v;
        update();
      },
    });

    function update() {
      results.replaceChildren();
      const r = decodeJwt(token);
      err.textContent = token.trim() && !r.ok ? r.error : '';
      if (!r.ok) return;

      const { header, payload, signature } = r.value;
      void signature;
      const headerJson = JSON.stringify(header, null, 2);
      const payloadJson = JSON.stringify(payload, null, 2);
      const expired = isExpired(payload);

      const badges = k.row(
        false,
        k.badge(`alg: ${String(header['alg'] ?? '—')}`, 'primary'),
        typeof payload['exp'] === 'number'
          ? k.badge(expired ? 'Expired' : 'Not expired', expired ? 'danger' : 'success')
          : null,
      );

      const code = (value: string) =>
        k.h(
          'pre',
          {
            class: 'nx-mono',
            style:
              'margin:0;white-space:pre-wrap;word-break:break-word;font-size:13px;max-height:320px;overflow:auto',
          },
          value,
        );

      const panels = k.grid2(
        k.panel({
          title: 'Header',
          actions: k.copyButton(() => headerJson),
          body: code(headerJson),
        }),
        k.panel({
          title: 'Payload',
          actions: k.copyButton(() => payloadJson),
          body: code(payloadJson),
        }),
      );

      results.append(badges, panels);

      const rows = TIME_CLAIMS.map((claim) => ({ claim, time: claimTime(payload[claim]) })).filter(
        (row) => row.time !== null,
      );
      if (rows.length > 0) {
        results.append(
          k.panel({
            title: 'Time claims',
            flush: true,
            body: k.table(
              rows.map((row) => [
                k.h('span', { class: 'nx-mono nx-primaryfg' }, row.claim),
                k.h('span', {}, row.time ?? ''),
              ]),
            ),
          }),
        );
      }
    }

    const tokenField = k.field('Encoded token', tokenTa);
    tokenField.append(err);

    root.append(
      k.stack(
        tokenField,
        results,
        k.h(
          'p',
          { class: 'nx-subtle' },
          'Decoded entirely in your browser. The signature is not verified and nothing is sent anywhere.',
        ),
      ),
    );
    update();
  },
}));
