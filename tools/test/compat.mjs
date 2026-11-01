// Cross-browser: runs the system in a second engine through WebDriver and compares it with Chromium.
//   node tools/test/compat.mjs --engine safari      real Safari on macOS (run `safaridriver --enable` once)
//   node tools/test/compat.mjs --engine firefox     Firefox + geckodriver
//   node tools/test/compat.mjs --engine webkitgtk   WebKit on Linux (apt install webkit2gtk-driver xvfb; run under xvfb-run)
//   node tools/test/compat.mjs --driver http://127.0.0.1:4444 --engine webkitgtk   use a driver that's already running
//
// 1. Every utility class: computed styles in the engine vs Chromium. Colors are compared as RGBA, lengths
//    within 1px (text is measured slightly differently by each engine). Values a browser doesn't
//    support are listed in KNOWN with the reason; anything else that differs fails.
// 2. Behaviour in the engine: responsive classes at each breakpoint, base.css, theme.js, Button
//    (submit, type default, loading blocks clicks and Enter, link Buttons, announcement), serupa-purge output.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PROJECT, read, writePage, browser, cleanup, report } from './lib.mjs';
import { ENGINES, startDriver, session, KEY } from './webdriver.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const engine = arg('--engine', 'webkitgtk');
const driverUrl = arg('--driver', null);

// Differences that come from browser support, not from the system. Keyed by class, then property.
const KNOWN = {
  'touch-pan-up': 'Safari supports only pan-x/pan-y, not the one-direction pan values',
  'touch-pan-down': 'same', 'touch-pan-left': 'same', 'touch-pan-right': 'same',
  'mask-clip-fill': 'Safari has no fill-box/stroke-box/view-box for mask-clip yet', 'mask-clip-stroke': 'same', 'mask-clip-view': 'same',
  'mask-origin-fill': 'same, for mask-origin', 'mask-origin-stroke': 'same', 'mask-origin-view': 'same',
  'place-content-baseline': 'Safari has no baseline value for align-content',
  // Alignment in block layout (justify-self / place-self on a block child) is new CSS: Chrome 130+ applies it,
  // Safari doesn't yet. In flex and grid, where these classes are normally used, both agree (checked below).
  // line-clamp-*: both engines clamp (checked below); Chrome reports the display as flow-root, Safari as -webkit-box.
  'line-clamp-1': 'display reported differently; clamping checked below', 'line-clamp-2': 'same', 'line-clamp-3': 'same', 'line-clamp-4': 'same', 'line-clamp-5': 'same', 'line-clamp-6': 'same',
  'mix-blend-plus-darker': 'plus-darker is a Safari-only blend mode; other browsers ignore it',
  'mix-blend-plus-lighter': 'support differs between engines',
  'from-current': 'Safari resolves currentcolor in a registered color variable to a color right away (Chrome keeps the keyword); the gradient looks the same',
  'via-current': 'same', 'to-current': 'same', 'scrollbar-thumb-current': 'same', 'scrollbar-track-current': 'same',
};
const KNOWN_PATTERNS = [
  [/^(justify|place)-self-(start|end|center|left|right|flex-start|flex-end|baseline|last-baseline|end-safe|center-safe)/, 'Safari ignores justify-self / place-self in block layout (new CSS; Chrome 130+). In grid they work (checked below)'],
];
const isKnown = (c) => KNOWN[c] || KNOWN_PATTERNS.some(([re]) => re.test(c));
const ZOOM = /^zoom-/;   // Safari reports zoomed lengths in computed styles (older zoom model); rendering matches

// ---------- color + number normalisation
function oklab(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const f = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return [f(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), f(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), f(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}
const pct = (x) => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x));
function color(fn, inner) {
  const a = inner.trim().split(/[\s,/]+/);
  let v;
  if (fn === 'rgb' || fn === 'rgba') v = [...a.slice(0, 3).map(Number), a[3] != null ? pct(a[3]) : 1];
  else if (fn === 'color' && a[0] === 'srgb') v = [...a.slice(1, 4).map((x) => x * 255), a[4] != null ? pct(a[4]) : 1];
  else if (fn === 'oklab') v = [...oklab(pct(a[0]), +a[1], +a[2]), a[3] != null ? pct(a[3]) : 1];
  else if (fn === 'oklch') { const h = (+a[2] * Math.PI) / 180; v = [...oklab(pct(a[0]), a[1] * Math.cos(h), a[1] * Math.sin(h)), a[3] != null ? pct(a[3]) : 1]; }
  else return `${fn}(${inner})`;
  if (v[3] === 0) return 'transparent';
  return `rgba(${v.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(x)))).join(',')},${+v[3].toFixed(2)})`;
}
// "0s, 0s, 0s" is the same as "0s": engines differ in whether they repeat a value for every listed property
const collapse = (s) => { const parts = s.split(', '); return parts.length > 1 && parts.every((x) => x === parts[0]) ? parts[0] : s; };
const norm = (s) => collapse(String(s)).replace(/\b(rgba?|color|oklab|oklch)\(([^()]*)\)/g, (_, f, i) => color(f, i)).replace(/\s+/g, ' ').trim();
function same(a, b) {
  if (a === b) return true;
  const A = norm(a), B = norm(b);
  if (A === B) return true;
  const na = A.match(/-?\d*\.?\d+/g) || [], nb = B.match(/-?\d*\.?\d+/g) || [];
  if (na.length !== nb.length || A.replace(/-?\d*\.?\d+/g, '#') !== B.replace(/-?\d*\.?\d+/g, '#')) return false;
  return na.every((x, i) => Math.abs(x - nb[i]) <= 1.01 || Math.abs(x - nb[i]) <= Math.abs(+x) * 0.03);
}
// Values that mean the same thing however a browser writes them
const EQUIV = [['none', undefined], ['normal', undefined], ['row', undefined], ['0px', undefined], ['0s', undefined]];
const equiv = (a, b) => EQUIV.some(([x, y]) => (norm(a) === x && b === y) || (norm(b) === x && a === y)) || (a && b && norm(a).split(', ').every((x, i, arr) => x === arr[0]) && norm(b).split(', ').every((x, i, arr) => x === arr[0]) && norm(a).split(', ')[0] === norm(b).split(', ')[0]);

// ---------- measurement (runs in both engines)
const css = (read('dist/bundle.css') + read('dist/utilities-extra.css')).replace(/\/\*[\s\S]*?\*\//g, '');
const unescape = (n) => n.replace(/\\([0-9a-f]{1,6}) ?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
const classes = [...new Set([...css.matchAll(/(?:^|[\s,}(])\.((?:[a-z0-9-]|\\[0-9a-f]{1,6} ?|\\.)+)(?=[\s{,:)>])/gim)].map((m) => unescape(m[1])))].filter((c) => !c.startsWith('dk-')).sort();
const internal = [...new Set([...css.matchAll(/--dk-[a-z0-9-]+/g)].map((m) => m[0]))];
const measure = ([list, internal]) => {
  const host = document.getElementById('host'); host.innerHTML = '';
  const base = document.createElement('div'); base.innerHTML = '<i>a</i><i>b</i>'; host.appendChild(base);
  const els = list.map((c) => { const w = document.createElement('section'); w.style.position = 'relative'; w.style.transform = 'translateZ(0)'; const d = document.createElement('div'); d.className = c; d.innerHTML = '<i>a</i><i>b</i>'; w.appendChild(d); host.appendChild(w); return d; });
  const B = getComputedStyle(base), B1 = getComputedStyle(base.firstChild);
  const props = []; for (let j = 0; j < B.length; j++) props.push(B[j]); for (const v of internal) if (!props.includes(v)) props.push(v);
  const bv = {}, b1 = {}; props.forEach((p) => { bv[p] = B.getPropertyValue(p); b1[p] = B1.getPropertyValue(p); });
  return { props, base: bv, base1: b1, out: els.map((d) => { const s = getComputedStyle(d), s1 = getComputedStyle(d.firstChild); const o = {};
    props.forEach((p) => { const v = s.getPropertyValue(p); if (v !== bv[p]) o[p] = v; const v1 = s1.getPropertyValue(p); if (v1 !== b1[p]) o['child ' + p] = v1; }); return o; }) };
};
// Neutral page: the same font, line height and margins in every engine, so only the system's CSS is compared.
const PAGE = () => writePage('compat.html', '<div id="host" style="position:relative;width:1000px;font-family:var(--font-sans);font-size:16px;line-height:20px"></div>', { extraHead: '<style>html,body{margin:0}</style>', extra: true });
async function measureAll(page) {
  await page.goto(PAGE());
  await page.evaluate(() => document.fonts.ready);
  const res = {}; let props = [], base = {}, base1 = {};
  for (let i = 0; i < classes.length; i += 500) {
    const chunk = classes.slice(i, i + 500);
    const r = await page.evaluate(measure, [chunk, internal]);
    props = r.props; base = r.base; base1 = r.base1; chunk.forEach((c, j) => { res[c] = r.out[j]; });
  }
  return { res, props, base, base1 };
}

// ---------- run
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
let drv = null;
const base = driverUrl || (drv = await startDriver(engine)).base;
const wd = await session(base, ENGINES[engine].caps);
console.log(`Engine: ${wd.name}`);
try {
  await wd.size(1240, 900);
  await wd.goto(PAGE());
  const vp = await wd.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const cb = await browser();
  const cpage = await cb.newPage({ viewport: vp });
  const C = await measureAll(cpage);
  await cb.close();
  const E = await measureAll(wd);

  const common = new Set(C.props.filter((p) => E.props.includes(p)));
  const unexpected = [], known = new Set();
  for (const c of classes) {
    const a = C.res[c], b = E.res[c];
    for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!common.has(p.replace('child ', ''))) continue;
      // a class that leaves a property alone shows the plain element's value
      const child = p.startsWith('child '), q = p.replace('child ', '');
      const va = a[p] ?? (child ? C.base1 : C.base)[q], vb = b[p] ?? (child ? E.base1 : E.base)[q];
      if (same(va, vb) || equiv(a[p], b[p])) continue;
      if (isKnown(c) || ZOOM.test(c)) { known.add(c); continue; }
      if (p.endsWith('outline-width') && /^-?outline-/.test(c)) continue;   // outline width while outline-style is none: engines report it differently
      unexpected.push(`.${c} ${p}: Chromium ${va} · ${engine} ${vb}`);
    }
  }
  t(`utilities: all ${classes.length} classes match Chromium (${known.size} differ only where the browser lacks support; see KNOWN)`, !unexpected.length, unexpected.slice(0, 12).join('\n      '));

  // the behaviour behind the KNOWN entries
  await wd.goto(writePage('compat-fn.html', '<div style="width:200px;font-size:16px;line-height:20px"><p id="lc" class="line-clamp-2">one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen</p></div><div class="grid" style="width:300px"><i id="js" class="justify-self-center">x</i><i id="ps" class="place-self-end">y</i></div>'));
  const fn = await wd.evaluate(() => { const g = (id) => document.getElementById(id).getBoundingClientRect(); return { clamp: Math.round(g('lc').height), js: Math.round(g('js').left + g('js').width / 2 - 150 - document.getElementById('js').parentElement.getBoundingClientRect().left), ps: Math.round(g('ps').right - document.getElementById('ps').parentElement.getBoundingClientRect().right) }; });
  t('line-clamp-2 clamps to two lines; justify-self-center and place-self-end work in grid', fn.clamp === 40 && Math.abs(fn.js) <= 1 && Math.abs(fn.ps) <= 1, JSON.stringify(fn));

  // responsive
  const RESP = writePage('compat-resp.html', '<div id="r" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"><i>1</i></div><p id="h" class="hidden md:block">x</p>', { extraHead: '<style>html,body{margin:0}</style>' });
  await wd.goto(RESP);
  const chrome = await wd.evaluate(() => ({ w: outerWidth - innerWidth }));
  for (const [w] of [[700, 2], [900, 3], [1100, 4], [1400, 5]]) {
    await wd.size(w + chrome.w, 900);
    await wd.evaluate((w) => new Promise((ok) => { const t0 = Date.now(); (function poll() { if (Math.abs(innerWidth - w) < 2 || Date.now() - t0 > 3000) ok(); else setTimeout(poll, 50); })(); }), w);
    const r = await wd.evaluate(() => ({ iw: innerWidth, cols: getComputedStyle(document.getElementById('r')).gridTemplateColumns.split(' ').length, h: getComputedStyle(document.getElementById('h')).display }));
    const want = r.iw >= 1280 ? 5 : r.iw >= 1024 ? 4 : r.iw >= 768 ? 3 : r.iw >= 640 ? 2 : 1;
    t(`responsive at ${r.iw}px: ${want} columns, md:block ${r.iw >= 768 ? 'shown' : 'hidden'}`, r.cols === want && r.h === (r.iw >= 768 ? 'block' : 'none'), JSON.stringify(r));
  }
  await wd.size(1240, 900);

  // base.css
  await wd.goto(writePage('compat-base.html', '<h1 id="h1">T</h1><input id="in" placeholder="x"><p id="u" class="m-4">u</p>', { base: true }));
  const bs = await wd.evaluate(() => { const tmp = document.createElement('div'); document.body.appendChild(tmp); tmp.style.backgroundColor = 'var(--surface)'; tmp.style.color = 'var(--placeholder)';
    return { bg: getComputedStyle(document.body).backgroundColor === getComputedStyle(tmp).backgroundColor, font: /Inter/.test(getComputedStyle(document.body).fontFamily), m: getComputedStyle(document.body).margin, h1: getComputedStyle(document.getElementById('h1')).marginTop,
      // some engines can't report ::placeholder styles; then this check is skipped
      ph: (() => { const probe = document.createElement('style'); probe.textContent = '#in::placeholder{outline-color:rgb(1,2,3)}'; document.head.appendChild(probe);
        const measurable = getComputedStyle(document.getElementById('in'), '::placeholder').outlineColor === 'rgb(1, 2, 3)'; probe.remove();
        return !measurable || getComputedStyle(document.getElementById('in'), '::placeholder').color === getComputedStyle(tmp).color; })(), inFont: /Inter/.test(getComputedStyle(document.getElementById('in')).fontFamily), u: getComputedStyle(document.getElementById('u')).marginTop, scheme: getComputedStyle(document.documentElement).colorScheme }; });
  t('base.css: body, headings, form fields, placeholder, utilities win, color-scheme', bs.bg && bs.font && bs.m === '0px' && bs.h1 === '0px' && bs.ph && bs.inFont && bs.u === '16px' && bs.scheme === 'light', JSON.stringify(bs));

  // theme.js
  await wd.goto(writePage('compat-theme.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-brand="emerald" data-mode="auto"' }));
  const th = await wd.evaluate(() => { try { localStorage.removeItem('serupa-theme'); } catch (e) {} Serupa.theme.reset(); const sys = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; return { got: document.documentElement.getAttribute('data-theme'), want: 'emerald-' + sys }; });
  t('theme.js: auto follows the system setting', th.got === th.want, JSON.stringify(th));
  const set = await wd.evaluate(() => { Serupa.theme.set({ brand: 'violet', mode: 'dark' }); return document.documentElement.getAttribute('data-theme'); });
  t('theme.js: set() applies the theme', set === 'violet-dark', set);
  const persisted = await wd.evaluate(() => { try { return JSON.parse(localStorage.getItem('serupa-theme')); } catch (e) { return 'storage unavailable'; } });
  t('theme.js: the choice is stored (or storage is unavailable and it still works)', persisted === 'storage unavailable' || (persisted && persisted.mode === 'dark'), JSON.stringify(persisted));
  await wd.evaluate(() => Serupa.theme.reset());

  // Button
  const APP = `<form id="f"><input id="in"><span id="slot"></span></form><div id="root"></div><script>
    var h = React.createElement, D = Serupa; window.log = [];
    document.getElementById('f').addEventListener('submit', function (e) { e.preventDefault(); log.push('submit'); });
    function App() { var s = React.useState(false); window.setL = s[1];
      return h('div', null,
        ReactDOM.createPortal(h(D.Button, { id: 'sub', type: 'submit', loading: s[0] }, 'Save'), document.getElementById('slot')),
        h('form', { onSubmit: function (e) { e.preventDefault(); log.push('BAD'); } }, h(D.Button, { id: 'plain' }, 'Plain')),
        h(D.Button, { href: '#go', id: 'link', loading: s[0] }, 'Link'),
        h(D.Button, { href: '#off', id: 'dlink', disabled: true }, 'Off')); }
    ReactDOM.createRoot(document.getElementById('root')).render(h(App));</script>`;
  await wd.goto(writePage('compat-button.html', APP, { react: true }));
  await wd.evaluate(() => new Promise((r) => setTimeout(r, 300)));
  const L = () => wd.evaluate(() => { const l = window.log.slice(); window.log.length = 0; return l; });
  await wd.click('#sub'); t('Button: type="submit" submits', (await L()).includes('submit'));
  await wd.click('#plain'); t('Button: type defaults to "button"', !(await L()).length);
  await wd.click('#in'); await wd.keys(KEY.Enter); t('Button: Enter in a field submits', (await L()).includes('submit'));
  await wd.evaluate(() => { window.setL(true); return new Promise((r) => setTimeout(r, 200)); });
  await wd.click('#sub'); t('Button loading: clicks do nothing', !(await L()).length);
  await wd.click('#in'); await wd.keys(KEY.Enter); t('Button loading: Enter in a field does not resubmit', !(await L()).length);
  const h0 = await wd.evaluate(() => location.hash); await wd.evaluate(() => document.getElementById('link').click());
  t('Button loading: a link Button does not navigate', (await wd.evaluate(() => location.hash)) === h0);
  t('Button: a disabled link has no href and is skipped by Tab', await wd.evaluate(() => { const d = document.getElementById('dlink'); d.focus(); return !d.hasAttribute('href') && d.getAttribute('aria-disabled') === 'true' && document.activeElement !== d; }));
  t('Button loading: "Loading" is announced', (await wd.evaluate(() => new Promise((r) => setTimeout(() => r(document.querySelector('[data-dk-announcer]').textContent), 150)))) === 'Loading');

  // Loader: the ring's arc grows and shrinks (dash animation on a pathLength="100" circle), and the dots pulse
  await wd.goto(writePage('compat-loader.html', '<div id="root"></div><script>var h=React.createElement;ReactDOM.createRoot(document.getElementById("root")).render(h(React.Fragment,null,h(Serupa.Loader,{id:"r",size:"lg",delay:0}),h(Serupa.Loader,{id:"d",variant:"dots",delay:0}),h(Serupa.Loader,{id:"sp",variant:"spokes",delay:0}),h(Serupa.Loader,{id:"px",variant:"pixel",delay:0}),h(Serupa.Loader,{id:"l",variant:"text",label:"Loading projects",delay:0}),h("div",{style:{display:"flex",gap:"12px",width:"300px"}},h(Serupa.Loader,{id:"sc",variant:"skeleton",shape:"circle",size:"lg",label:"",delay:0}),h(Serupa.Loader,{id:"st",variant:"skeleton",lines:3,label:"",delay:0}))));</script>', { react: true }));
  const sp = await wd.evaluate(() => new Promise((res) => setTimeout(() => {
    const arc = document.querySelector('#r .dk-loader__arc'), svg = document.querySelector('#r svg');
    const len = (ms) => { const a = arc.getAnimations().find((x) => x.animationName === 'dk-loader-arc'); if (!a) return NaN; a.pause(); a.currentTime = ms; return parseFloat(getComputedStyle(arc).strokeDasharray); };
    const v = { dot: len(0), long: len(750), turn: getComputedStyle(svg).animationName + ' ' + getComputedStyle(svg).animationDuration, dots: [...document.querySelectorAll('#d .dk-loader__dot')].map((c) => getComputedStyle(c).animationName), w: Math.round(document.getElementById('r').getBoundingClientRect().width), lab: (() => { const l = document.querySelector('#l .dk-loader__label'), g = l.querySelector('.dk-loader__glint'), st = getComputedStyle(g, '::after'); return [st.content, getComputedStyle(l).webkitTextFillColor, /gradient/.test(getComputedStyle(g).maskImage || getComputedStyle(g).webkitMaskImage), st.animationName, Math.round(l.getBoundingClientRect().width)]; })(),
      px: [...document.querySelectorAll('#px rect.dk-loader__px')].map((r) => getComputedStyle(r).animationName + '@' + getComputedStyle(r).animationDelay).join(','),
      spk: (() => { const s = document.querySelector('#sp svg'); return [document.querySelectorAll('#sp line').length, getComputedStyle(s).animationName, getComputedStyle(s).animationTimingFunction, getComputedStyle(document.querySelectorAll('#sp line')[7]).opacity]; })(),
      sk: (() => { const bones = [...document.querySelectorAll('#st .dk-loader__bone')]; return { w: bones.map((x) => Math.round(x.getBoundingClientRect().width)), h: Math.round(document.getElementById('st').getBoundingClientRect().height), c: Math.round(document.getElementById('sc').getBoundingClientRect().width), grad: /gradient/.test(getComputedStyle(bones[0], '::after').backgroundImage), anim: getComputedStyle(bones[0], '::after').animationName }; })() };
    res(v); }, 200)));
  t('Loader: the ring turns (2s) while its arc grows from a dot to most of the ring', sp.dot <= 2 && sp.long >= 60 && sp.turn === 'spin 2s' && sp.w === 40, JSON.stringify(sp));
  t('Loader: the text variant shines (a full-color copy of the words in a sliding window)', sp.lab[0] === '"Loading projects"' && sp.lab[2] && sp.lab[3] === 'dk-loader-glint' && sp.lab[4] > 40, JSON.stringify(sp.lab));
  t('Loader: the skeleton draws three 20px lines beside a 40px circle, the last line shorter, shimmering', sp.sk.c === 40 && sp.sk.h === 60 && sp.sk.w[0] === 248 && sp.sk.w[2] === Math.round(248 * 0.6) && sp.sk.grad && sp.sk.anim === 'dk-loader-sweep', JSON.stringify(sp.sk));
  t('Loader: the pixel grid runs its diagonal wave', sp.px === 'dk-loader-pixel@0s,dk-loader-pixel@0.075s,dk-loader-pixel@0.15s,dk-loader-pixel@0.075s,dk-loader-pixel@0.15s,dk-loader-pixel@0.225s,dk-loader-pixel@0.15s,dk-loader-pixel@0.225s,dk-loader-pixel@0.3s', sp.px);
  t('Loader: the spokes tick round, fading behind the lead spoke', sp.spk[0] === 8 && sp.spk[1] === 'dk-loader-tick' && /step-end|steps\(1(, (jump-)?end)?\)/.test(sp.spk[2]) && sp.spk[3] === '0.25', JSON.stringify(sp.spk));
  t('Loader: the dots pulse', sp.dots.length === 3 && sp.dots.every((n) => n === 'dk-loader-dot'), JSON.stringify(sp.dots));

  // serupa-purge output renders the same in this engine
  const dir = path.join(PROJECT, '.test-tmp'); fs.mkdirSync(dir, { recursive: true });
  const SAMPLE = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-surface-muted"><div class="rounded-lg shadow-md p-4 bg-surface text-sm md:text-base divide-y divide-border"><p class="py-2">a</p><p class="py-2">b</p></div><input class="h-control-md px-3 border border-field-border bg-field rounded-md" placeholder="Name"><p class="hidden lg:block text-primary">x</p></div>';
  fs.writeFileSync(path.join(dir, 'sample.html'), SAMPLE);
  execFileSync(process.execPath, [path.join(PROJECT, 'bin', 'serupa-purge.mjs'), path.join(dir, 'sample.html'), '-o', path.join(dir, 'min.css'), '--css', path.join(PROJECT, 'dist', 'bundle.css')], { stdio: 'ignore' });
  const snap = async (bundle) => { await wd.goto(writePage('compat-purge.html', SAMPLE, { bundle })); await wd.evaluate(() => document.fonts.ready);
    return wd.evaluate(() => [...document.querySelectorAll('body *')].map((e) => { const s = getComputedStyle(e), o = []; for (let i = 0; i < s.length; i++) o.push(s[i] + ':' + s.getPropertyValue(s[i])); return o.sort().join(';'); }).join('\n')); };
  t('serupa-purge: trimmed CSS renders identically in this engine', (await snap('../dist/bundle.css')) === (await snap('min.css')));
} finally {
  await wd.quit().catch(() => {});
  if (drv) drv.stop();
  cleanup();
}
process.exit(report(`Compat (${engine})`, R) ? 0 : 1);
