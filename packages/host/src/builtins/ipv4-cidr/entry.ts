import { calcCidr } from '@nexine/tool-ipv4-cidr';

import { createApp, register } from '../_kit';
export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);
    const inp = k.input({ placeholder: '192.168.1.1/24' });
    const out = k.textarea({ readOnly: true, minHeight: 150 });
    const update = () => {
      out.value = JSON.stringify(calcCidr(inp.value), null, 2);
    };
    inp.addEventListener('input', update);
    root.append(
      k.panel({ title: 'CIDR Calculator', body: k.stack(k.field('CIDR String', inp), out) }),
    );
  },
}));
