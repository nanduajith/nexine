import { generateSVG } from '@nexine/tool-qrcode';

import { createApp, register } from '../_kit';

export default register((ctx) => ({
  mount(root) {
    const k = createApp(root, ctx);

    const input = k.textarea({
      minHeight: 300,
      placeholder: 'Enter text or URL to generate QR code...',
    });

    const svgContainer = k.h(
      'div',
      {
        class: 'nx-empty',
        style: 'display:flex;align-items:center;justify-content:center;min-height:300px',
      },
      'Output will appear here',
    );

    let currentSvg = '';

    const update = async () => {
      const val = input.value;
      if (!val.trim()) {
        currentSvg = '';
        svgContainer.innerHTML = 'Output will appear here';
        svgContainer.className = 'nx-empty';
        return;
      }

      // Check current theme to decide QR colors
      const isDark = document.documentElement.dataset.theme === 'dark';

      try {
        const result = await generateSVG(val, {
          color: {
            dark: isDark ? '#e9e9f2ff' : '#1a1a25ff',
            light: '#00000000',
          },
        });
        currentSvg = result;
        svgContainer.innerHTML = `<div style="width:100%;max-width:280px">${result}</div>`;
        svgContainer.className = '';
      } catch (err) {
        currentSvg = '';
        svgContainer.innerHTML = String(err);
        svgContainer.className = 'nx-error';
      }
    };

    input.addEventListener('input', () => void update());

    // Listen for theme changes to regenerate QR colors
    const observer = new MutationObserver(() => void update());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    root.append(
      k.grid2(
        k.panel({
          title: 'Data',
          body: input,
          flush: true,
        }),
        k.panel({
          title: 'QR Code',
          actions: k.copyButton(() => currentSvg, { label: 'Copy SVG' }),
          body: svgContainer,
        }),
      ),
    );

    update();
  },
}));
