/* Nexine docs site — vanilla JS, no dependencies. */
(() => {
  'use strict';

  /* ---------- Progressive enhancement flag (gates scroll-reveal) ---------- */
  const root = document.documentElement;
  root.classList.add('js');

  /* ---------- Theme ---------- */
  const stored = localStorage.getItem('nx-docs-theme');
  if (stored) root.setAttribute('data-theme', stored);
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  const moon = '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"></path>';
  const sun =
    '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
  const paintIcon = () => {
    themeIcon.innerHTML = root.getAttribute('data-theme') === 'light' ? moon : sun;
  };
  paintIcon();
  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('nx-docs-theme', next);
    paintIcon();
  });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks
    ?.querySelectorAll('a')
    .forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ---------- Year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = '© ' + new Date().getFullYear() + ' Nexine contributors';

  /* ---------- Tool catalog ---------- */
  const TOOLS = [
    {
      name: 'JWT Decoder',
      cat: 'Crypto & Security',
      desc: 'Decode & inspect JSON Web Tokens locally. Sensitive — no history.',
    },
    {
      name: 'Hash',
      cat: 'Crypto & Security',
      desc: 'SHA-1 / 256 / 384 / 512 digests via WebCrypto.',
    },
    {
      name: 'Base64',
      cat: 'Encoding',
      desc: 'Encode/decode, Unicode-safe, with the URL-safe variant.',
    },
    { name: 'Hex Converter', cat: 'Encoding', desc: 'Convert between text and hexadecimal bytes.' },
    {
      name: 'URL Encode',
      cat: 'Web',
      desc: 'Percent-encode/decode text and inspect query parameters.',
    },
    {
      name: 'HTML Entities',
      cat: 'Web',
      desc: 'Escape and unescape named, decimal, and hex entities.',
    },
    { name: 'JSON Formatter', cat: 'Data', desc: 'Beautify, minify, and validate JSON.' },
    {
      name: 'RegEx Tester',
      cat: 'Text',
      desc: 'Test patterns against sample text with live match highlighting.',
    },
    { name: 'Case Converter', cat: 'Text', desc: 'camelCase, snake_case, kebab-case, and more.' },
    { name: 'UUID Generator', cat: 'Generators', desc: 'RFC 4122 v4 UUIDs from a secure CSPRNG.' },
    { name: 'Timestamp', cat: 'Time', desc: 'Convert between Unix time and human-readable dates.' },
    {
      name: 'Sandbox Demo',
      cat: 'Data',
      desc: 'A self-test plugin that proves origin isolation and network denial.',
    },
  ];
  const grid = document.getElementById('toolGrid');
  const empty = document.getElementById('toolEmpty');
  if (grid) {
    grid.innerHTML = TOOLS.map(
      (t) =>
        `<div class="tool" data-name="${t.name.toLowerCase()}" data-cat="${t.cat.toLowerCase()}">
           <h4>${t.name}</h4>
           <div class="catlabel">${t.cat}</div>
           <p>${t.desc}</p>
         </div>`,
    ).join('');
    const search = document.getElementById('toolSearch');
    search?.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      grid.querySelectorAll('.tool').forEach((el) => {
        const hit =
          !q ||
          el.dataset.name.includes(q) ||
          el.dataset.cat.includes(q) ||
          el.textContent.toLowerCase().includes(q);
        el.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pre = btn.parentElement.querySelector('pre');
      const text = pre ? pre.innerText : '';
      navigator.clipboard?.writeText(text).then(() => {
        const prev = btn.textContent;
        btn.textContent = 'Copied ✓';
        setTimeout(() => (btn.textContent = prev), 1400);
      });
    });
  });

  /* ---------- Tabs ---------- */
  const tabWrap = document.getElementById('startTabs');
  if (tabWrap) {
    const panes = document.querySelectorAll('.tabpane');
    tabWrap.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => {
        tabWrap.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        panes.forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab));
      });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  document.querySelectorAll('.shot img').forEach((img) => {
    img.addEventListener('click', () => {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add('open');
    });
  });
  lb?.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lb?.classList.remove('open');
  });

  /* ---------- Scroll-spy (sidebar + reveal) ---------- */
  const sideLinks = [...document.querySelectorAll('.side a')];
  const byId = new Map(sideLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          sideLinks.forEach((a) => a.classList.remove('active'));
          byId.get(e.target.id)?.classList.add('active');
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );
  document.querySelectorAll('section[id]').forEach((s) => spy.observe(s));

  const reveal = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));
})();
