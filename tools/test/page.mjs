// Page groundwork: responsive variants, base.css, theme.js (automatic dark mode), the CSS trimmer (bin/serupa-purge.mjs)
// and the plain-page sample in Getting started.
//   node tools/test/page.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ENGINE, PROJECT, writePage, browser, cleanup, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const b = await browser();

// 1. Responsive variants apply from their breakpoint up
const RESP = '<div id="r" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-6"><i>1</i><i>2</i></div><p id="h" class="hidden md:block">x</p><p id="s" class="text-sm lg:text-xl">x</p>';
const respUrl = writePage('responsive.html', RESP);
const expect = [[390, 1, 'none', 14], [640, 2, 'none', 14], [768, 3, 'block', 14], [1024, 4, 'block', 20], [1280, 5, 'block', 20], [1536, 6, 'block', 20]];
for (const [w, cols, disp, fs_] of expect) {
  const p = await b.newPage({ viewport: { width: w, height: 600 } });
  await p.goto(respUrl);
  const r = await p.evaluate(() => ({ cols: getComputedStyle(document.getElementById('r')).gridTemplateColumns.split(' ').length, disp: getComputedStyle(document.getElementById('h')).display, fs: parseFloat(getComputedStyle(document.getElementById('s')).fontSize) }));
  t(`responsive at ${w}px: ${cols} columns, hidden→${disp}, text ${fs_}px`, r.cols === cols && r.disp === disp && r.fs === fs_, JSON.stringify(r));
  await p.close();
}

// 2. base.css
{
  const p = await b.newPage();
  await p.goto(writePage('base.html', '<h1 id="h1">Title</h1><a id="a" href="#">link</a><input id="in" placeholder="Name"><img id="img" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%222000%22 height=%2210%22/%3E"><p id="u" class="m-4 font-mono">utility wins</p>', { base: true }));
  const r = await p.evaluate(() => {
    const cs = (id, pr) => getComputedStyle(document.getElementById(id)).getPropertyValue(pr);
    const tmp = document.createElement('div'); document.body.appendChild(tmp);
    const col = (n) => { tmp.style.color = `var(${n})`; return getComputedStyle(tmp).color; };
    return { bodyBg: getComputedStyle(document.body).backgroundColor, surface: (() => { tmp.style.backgroundColor = 'var(--surface)'; return getComputedStyle(tmp).backgroundColor; })(), bodyColor: getComputedStyle(document.body).color, text: col('--text'),
      bodyMargin: getComputedStyle(document.body).margin, font: getComputedStyle(document.body).fontFamily, h1Margin: cs('h1', 'margin-top'), link: cs('a', 'color'), primary: col('--primary'),
      inputFont: cs('in', 'font-family'), ph: getComputedStyle(document.getElementById('in'), '::placeholder').color, placeholder: col('--placeholder'),
      imgW: document.getElementById('img').getBoundingClientRect().width, vw: document.body.clientWidth, boxSizing: cs('in', 'box-sizing'),
      utilMargin: cs('u', 'margin-top'), utilFont: cs('u', 'font-family'), scheme: getComputedStyle(document.documentElement).colorScheme };
  });
  t('base.css: body uses surface, text and font-sans, no margin', r.bodyBg === r.surface && r.bodyColor === r.text && r.bodyMargin === '0px' && /Inter/.test(r.font), JSON.stringify(r));
  t('base.css: no default heading margins, links in primary, border-box sizing', r.h1Margin === '0px' && r.link === r.primary && r.boxSizing === 'border-box');
  t('base.css: form fields use the page font and the placeholder color', /Inter/.test(r.inputFont) && r.ph === r.placeholder, `${r.inputFont} ${r.ph} vs ${r.placeholder}`);
  t('base.css: images never overflow their container', r.imgW <= r.vw, `${r.imgW} > ${r.vw}`);
  t('base.css: utility classes win over the defaults', r.utilMargin === '16px' && /ui-monospace/.test(r.utilFont));
  t('base.css: light themes use color-scheme light', r.scheme === 'light', r.scheme);
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'violet-dark'));
  t('base.css: dark themes use color-scheme dark (native controls, scrollbars)', (await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === 'dark');
  await p.close();
}

// 3. theme.js
for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ colorScheme: scheme });
  const p = await ctx.newPage();
  await p.goto(writePage('theme.html', '<p>x</p>', { theme: true, base: true, htmlAttrs: 'data-brand="emerald" data-mode="auto"' }));
  t(`theme.js: data-mode="auto" follows the system (${scheme})`, (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === `emerald-${scheme}`);
  await ctx.close();
}
{
  // A page that sets data-theme itself keeps it, under a dark system too, and reset() goes back to it.
  const ctx = await b.newContext({ colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto(writePage('theme-own.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-theme="violet-dark"' }));
  const own = await p.evaluate(() => [document.documentElement.getAttribute('data-theme'), Serupa.theme.get().mode, Serupa.theme.set({ mode: 'light' }).theme, Serupa.theme.reset().theme]);
  t('theme.js: a page\'s own data-theme="violet-dark" is its default, not replaced by blue', own.join() === 'violet-dark,dark,violet-light,violet-dark', own.join());
  await ctx.close();
}
{
  const ctx = await b.newContext({ colorScheme: 'light' });
  const p = await ctx.newPage();
  const url = writePage('theme.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-brand="blue" data-mode="auto"' });
  await p.goto(url);
  await p.evaluate(() => { window.__seen = []; Serupa.theme.onChange((i) => window.__seen.push(i.theme)); });
  await p.emulateMedia({ colorScheme: 'dark' }); await p.waitForTimeout(100);
  t('theme.js: switches live when the system changes', (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'blue-dark');
  t('theme.js: onChange hears the system switch', (await p.evaluate(() => window.__seen)).includes('blue-dark'));
  const r = await p.evaluate(() => Serupa.theme.set({ brand: 'violet', mode: 'light' }));
  t('theme.js: set() changes brand and mode', r.theme === 'violet-light' && (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'violet-light');
  await p.reload();
  t('theme.js: the choice is remembered after a reload', (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'violet-light');
  await p.evaluate(() => Serupa.theme.set({ brand: 'nope', mode: 'nope' }));
  t('theme.js: unknown values are ignored', (await p.evaluate(() => Serupa.theme.get().theme)) === 'violet-light');
  const back = await p.evaluate(() => Serupa.theme.reset());
  t('theme.js: reset() returns to the page default', back.theme === 'blue-dark' && back.mode === 'auto');
  await ctx.close();
}
{
  // <meta name="theme-color"> follows the page's surface in all six themes, so a phone's bars change with the mode.
  // Before any stylesheet it is the token value (white, zinc-900); a page's own theme-color meta is left alone.
  const ctx = await b.newContext({ colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto(writePage('theme-color.html', '<p>x</p>', { theme: true, base: true, htmlAttrs: 'data-brand="blue" data-mode="auto"' }));
  const tints = await p.evaluate(() => ['blue', 'violet', 'emerald'].flatMap((brand) => ['light', 'dark'].map((mode) => {
    Serupa.theme.set({ brand, mode });
    const m = document.querySelectorAll('meta[name="theme-color"]');
    return [m.length, m[0] && m[0].getAttribute('content'), getComputedStyle(document.body).backgroundColor].join(' ');
  })));
  t('theme.js: theme-color is the page\'s surface in all six themes', tints.every((x, k) => x === (k % 2 ? '1 rgb(24, 24, 27) rgb(24, 24, 27)' : '1 rgb(255, 255, 255) rgb(255, 255, 255)')), tints.join(', '));
  await p.evaluate(() => Serupa.theme.reset());
  await p.goto(writePage('theme-color-bare.html', '<p>x</p>', { theme: true, bundle: 'none.css', htmlAttrs: 'data-mode="dark"', extraHead: '<script>window.__early = document.querySelector(\'meta[name="theme-color"]\').content;</script>' }));
  const early = await p.evaluate(() => window.__early);
  t('theme.js: before the stylesheets, theme-color is the token value (zinc-900 in dark)', early === '#18181b', early);
  const own = writePage('theme-color-own.html', '<p>x</p>', { theme: true, base: true, htmlAttrs: 'data-mode="dark"' });
  fs.writeFileSync(fileURLToPath(own), fs.readFileSync(fileURLToPath(own), 'utf8').replace('<script src="../dist/theme.js">', '<meta name="theme-color" content="#123456"><script src="../dist/theme.js">'));
  await p.goto(own);
  const kept = await p.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content')).join());
  t('theme.js: a theme-color meta the page wrote itself is left as it is', kept === '#123456', kept);
  await ctx.close();
}
{
  // A choice saved by 4.x (as "diki-theme") is kept, and reset() forgets it for good.
  const ctx = await b.newContext({ colorScheme: 'light' });
  const p = await ctx.newPage();
  const url = writePage('theme.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-brand="blue" data-mode="auto"' });
  await p.goto(url);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('diki-theme', JSON.stringify({ brand: 'violet', mode: 'dark' })); });
  await p.reload();
  t('theme.js: a theme chosen on 4.x ("diki-theme") is kept and moved to "serupa-theme"', (await p.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('diki-theme'), !!localStorage.getItem('serupa-theme')].join())) === 'violet-dark,,true');
  await p.evaluate(() => Serupa.theme.reset());
  await p.reload();
  t('theme.js: after reset(), a reload stays on the page default (the 4.x choice doesn\'t come back)', (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'blue-light');
  await ctx.close();
}

{
  // DX1: loaded twice (an inline copy and the file), the second copy returns early, so the first's onChange still
  // hears set(); and another tab's localStorage.clear() (a storage event with key null) is followed like a reset.
  const ctx = await b.newContext({ colorScheme: 'light' });
  const p = await ctx.newPage();
  await p.goto(writePage('theme-twice.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-brand="blue" data-mode="auto"', extraHead: '<script>window.__first = Serupa.theme; window.__heard = []; Serupa.theme.onChange(function (i) { window.__heard.push(i.theme); });</script><script src="../dist/theme.js"></script>' }));
  const twice = await p.evaluate(() => { Serupa.theme.set({ brand: 'violet', mode: 'dark' }); return [Serupa.theme === window.__first, window.__heard.join(), window.__first.get().theme]; });
  t('theme.js: loaded twice, the first copy keeps running the page and its onChange hears set()', twice.join() === 'true,violet-dark,violet-dark', twice.join());
  const other = await ctx.newPage();
  await other.goto(writePage('theme-twice.html', '<p>x</p>', { theme: true, htmlAttrs: 'data-brand="blue" data-mode="auto"' }));
  await other.evaluate(() => localStorage.clear());
  await p.waitForTimeout(100);
  const cleared = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  t('theme.js: another tab clearing storage brings this tab back to the page default', cleared === 'blue-light', cleared);
  await ctx.close();
}

{
  // GD5, GF4: a theme switch changes every control's colors at once (each one's color transition finishes at once),
  // while motion started in the same tick runs on: a menu fading out as "Dark" is picked, a switch thumb sliding.
  const p = await b.newPage();
  const rows = '<p class="row" style="transition: background-color 150ms, color 150ms; background: var(--surface-muted); color: var(--text)">Row</p>'.repeat(20)
    + '<div class="menu" style="transition: opacity 150ms, scale 150ms; background: var(--surface)">Menu</div>'
    + '<div class="thumb" style="width: 16px; transition: translate 150ms, background-color 150ms; background: var(--surface-muted)"></div>'
    + '<p class="still" style="background: var(--surface-muted)">Row</p>';
  await p.goto(writePage('theme-switch.html', rows, { theme: true, htmlAttrs: 'data-brand="blue" data-mode="light"', extraHead: '<link rel="stylesheet" href="../tokens.css">' }));
  const r = await p.evaluate(() => {
    document.querySelector('.menu').style.cssText += ';opacity: 0; scale: 0.95';   // closing as "Dark" is picked
    void getComputedStyle(document.querySelector('.menu')).opacity;   // its fade has started
    Serupa.theme.set({ mode: 'dark' });
    document.querySelector('.thumb').style.translate = '16px';
    const bg = (s) => getComputedStyle(document.querySelector(s)).backgroundColor;
    return [document.getAnimations().map((a) => a.transitionProperty).sort().join(' '), bg('.row') === bg('.still')];
  });
  t('theme.js: switching theme changes every color at once, while a menu fading and a switch sliding in the same tick run on', r.join() === 'opacity scale translate,true', r.join());
  await p.close();
}

// 3b. debug.js (204): off until ?serupa-debug; then each component is outlined, pointing at one names it with its
// classes, state and the component tokens set on it, it survives a reload in the tab, and Escape turns it off. It
// shares window.Serupa with the components and theme.js.
{
  const body = '<div id="root"></div><script>ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Serupa.Button, { id: "b", style: { "--button-radius": "0px" } }, "Save"));</script>';
  const url = writePage('debug.html', body, { react: true, theme: true, extraHead: '<script src="../dist/debug.js"></script>' });
  const p = await b.newPage();
  await p.goto(url);
  await p.waitForSelector('#b');
  t('debug.js: off by default, and window.Serupa keeps the components and theme', await p.evaluate(() => !document.getElementById('serupa-debug') && !Serupa.debug.isOn() && typeof Serupa.Button === 'object' && typeof Serupa.theme.get === 'function'));
  await p.goto(url + '?serupa-debug');
  await p.waitForSelector('#b');
  t('debug.js: ?serupa-debug turns it on and outlines each component', await p.evaluate(() => Serupa.debug.isOn() && getComputedStyle(document.getElementById('b')).outlineStyle === 'dashed'));
  await p.hover('#b');
  const panel = await p.evaluate(() => document.getElementById('serupa-debug-panel')?.textContent || '');
  t('debug.js: pointing at a Button names it, its variant and size, and the token set on it', /button/.test(panel) && /primary/.test(panel) && /size-md/.test(panel) && /--button-radius\s*0px/.test(panel), panel);
  const info = await p.evaluate(() => { const i = Serupa.debug.inspect(document.querySelector('#b .dk-btn__label')); return i && { c: i.component, m: i.modifiers, r: i.tokens['--button-radius'], h: i.height }; });
  t('debug.js: inspect() finds the component from an element inside it', info?.c === 'button' && info.m.includes('primary') && info.r === '0px' && info.h === 32, JSON.stringify(info));
  await p.goto(url);
  await p.waitForSelector('#b');
  t('debug.js: it stays on for the tab after the address loses ?serupa-debug', await p.evaluate(() => Serupa.debug.isOn()));
  await p.keyboard.press('Escape');
  t('debug.js: Escape turns it off and takes its outline and panel away', await p.evaluate(() => !Serupa.debug.isOn() && !document.getElementById('serupa-debug') && !document.getElementById('serupa-debug-panel') && sessionStorage.getItem('serupa-debug') === null));
  await p.close();
}

// 4. serupa-purge keeps exactly what a page needs
{
  const dir = path.join(PROJECT, '.test-tmp');
  fs.mkdirSync(dir, { recursive: true });
  const SAMPLE = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-surface-muted"><div class="rounded-lg shadow-md p-4 bg-surface text-sm md:text-base divide-y divide-border"><p class="py-2">a</p><p class="py-2">b</p></div><input class="h-control-md px-3 border border-field-border bg-field rounded-md placeholder-placeholder" placeholder="Name"><div class="bg-linear-to-r from-blue-500 to-violet-500 h-4 -translate-x-1/2 ring-2 ring-focus-ring ring-offset-2 animate-spin"></div><p class="hidden lg:block text-primary">x</p></div>';
  fs.writeFileSync(path.join(dir, 'sample.html'), SAMPLE);
  const out = path.join(dir, 'min.css');
  execFileSync(process.execPath, [path.join(PROJECT, 'bin', 'serupa-purge.mjs'), path.join(dir, 'sample.html'), '-o', out, '--css', path.join(PROJECT, 'dist', 'bundle.css')], { stdio: 'ignore' });
  // Component styles (dk-*) are always kept and grow with every component, so the size check trims utilities.css,
  // the part purge decides on.
  const full = fs.statSync(path.join(PROJECT, 'dist', 'bundle.css')).size, small = fs.statSync(out).size;
  const outU = path.join(dir, 'min-utilities.css');
  execFileSync(process.execPath, [path.join(PROJECT, 'bin', 'serupa-purge.mjs'), path.join(dir, 'sample.html'), '-o', outU, '--css', path.join(PROJECT, 'dist', 'utilities.css')], { stdio: 'ignore' });
  const fullU = fs.statSync(path.join(PROJECT, 'dist', 'utilities.css')).size, smallU = fs.statSync(outU).size;
  t(`serupa-purge: ${(small / 1024).toFixed(0)} KB instead of ${(full / 1024).toFixed(0)} KB (utilities: ${(smallU / 1024).toFixed(0)} KB of ${(fullU / 1024).toFixed(0)} KB)`, smallU > 0 && smallU < fullU / 20 && full - small > (fullU - smallU) * 0.9);   // the bundle sheds what the utilities shed
  const snap = async (bundle, w) => {
    const p = await b.newPage({ viewport: { width: w, height: 500 } });
    await p.goto(writePage(`purge-${w}.html`, SAMPLE, { bundle, extraHead: '<style>*{animation-play-state:paused!important;animation-delay:0s!important}</style>' }));   // a spinning element would be caught mid-turn
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);   // sizes depend on the font being loaded
    const r = await p.evaluate(() => [...document.querySelectorAll('body *')].map((e) => { const s = getComputedStyle(e); const o = []; for (let i = 0; i < s.length; i++) o.push(s[i] + ':' + s.getPropertyValue(s[i])); return o.sort().join(';'); }));
    await p.close(); return r;
  };
  t('serupa-purge: keeps the keyframes the page animates with', /@keyframes spin\b/.test(fs.readFileSync(out, 'utf8')));
  for (const w of [390, 1280]) {
    const a = await snap('../dist/bundle.css', w), c = await snap('min.css', w);
    const d = []; a.forEach((x, i) => { if (x !== c[i]) { const A = x.split(';'), C = c[i].split(';'); A.forEach((y, j) => { if (y !== C[j]) d.push(i + ' ' + y + ' ≠ ' + C[j]); }); } });
    t(`serupa-purge: the page renders identically with the trimmed CSS (${w}px)`, !d.length, d.slice(0, 4).join(' | '));
  }
}

// 5. serupa-purge --components: each component's preview, named as its only source, renders identically with the
// styles of every component it doesn't name dropped (components.json says which ones it needs)
{
  const dir = path.join(PROJECT, '.test-tmp');
  const comps = fs.readdirSync(path.join(PROJECT, 'src', 'components')).filter((c) => fs.existsSync(path.join(PROJECT, 'src', 'components', c, 'preview.html')));
  const styles = async (url) => {
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
    await p.goto(url);
    await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
    await p.waitForTimeout(150);   // previews that open a popover do it on a 50 ms timer
    const r = await p.evaluate(() => [...document.querySelectorAll('body *')].map((e) => { const s = getComputedStyle(e); const o = []; for (let i = 0; i < s.length; i++) o.push(s[i] + ':' + s.getPropertyValue(s[i])); return e.className + ' ' + o.sort().join(';'); }));
    await p.close(); return r;
  };
  let full = 0, small = 0;
  for (const c of comps) {
    const src = path.join(PROJECT, 'src', 'components', c, 'preview.html');
    const html = fs.readFileSync(src, 'utf8');
    const head = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0] + '<style>*{animation:none!important;transition:none!important}</style>';
    const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
    const out = path.join(dir, `purge-${c}.css`);
    execFileSync(process.execPath, [path.join(PROJECT, 'bin', 'serupa-purge.mjs'), src, '-o', out, '--css', path.join(PROJECT, 'dist', 'bundle.css'), '--components'], { stdio: 'ignore' });
    const keptOnly = execFileSync(process.execPath, ['-e', `process.stdout.write(String(require('fs').statSync(${JSON.stringify(out)}).size))`]).toString();
    const a = await styles(writePage(`pc-full-${c}.html`, body, { react: true, extraHead: head }));
    const z = await styles(writePage(`pc-min-${c}.html`, body, { react: true, extraHead: head, bundle: `purge-${c}.css` }));
    const d = []; a.forEach((x, i) => { if (x !== z[i]) { const A = x.split(';'), Z = (z[i] || '').split(';'); A.forEach((y, j) => { if (y !== Z[j]) d.push(`${i} ${y} ≠ ${Z[j]}`); }); } });
    if (a.length !== z.length) d.unshift(`${a.length} elements with the full CSS, ${z.length} with the trimmed`);
    full += fs.statSync(path.join(PROJECT, 'dist', 'bundle.css')).size; small += Number(keptOnly);
    t(`serupa-purge --components: ${c}'s preview renders identically`, !d.length, d.slice(0, 3).join(' | '));
  }
  t(`serupa-purge --components: ${comps.length} previews average ${(small / comps.length / 1024).toFixed(0)} KB of CSS`, small < full);
}

// 6. The plain-page sample in docs/GettingStarted.mdx works as written: served from the project over HTTP (a font
// preload is fetched with CORS, which file:// doesn't do), it's in standards mode, UTF-8, titled, draws its Button in
// Inter inside main, gets a theme-color, fetches the font once (the preload is the one the page uses) and logs nothing.
{
  const html = fs.readFileSync(path.join(PROJECT, 'docs', 'GettingStarted.mdx'), 'utf8').match(/^## Or on a plain page\s+```html\n([\s\S]*?)```/m)?.[1] || '';
  const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url || '/', 'http://x').pathname);
    const file = path.join(PROJECT, url);
    if (url === '/') { res.setHeader('content-type', 'text/html'); res.end(html); }
    else if (!file.startsWith(PROJECT + path.sep) || !fs.existsSync(file)) { res.statusCode = 404; res.end(); }
    else { res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', () => r(undefined)));
  const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
  const p = await b.newPage();
  const logged = [], fonts = [];
  p.on('console', (m) => logged.push(`${m.type()}: ${m.text()}`));
  p.on('pageerror', (e) => logged.push(e.message));
  p.on('request', (q) => { if (q.url().endsWith('.woff2')) fonts.push(new URL(q.url()).pathname); });
  await p.goto(`http://127.0.0.1:${port}/`);
  await p.waitForFunction(() => !!document.querySelector('#root button'), null, { timeout: 10000 }).catch(() => undefined);
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => {
    const btn = document.querySelector('main button');
    return { mode: document.compatMode, charset: document.characterSet, title: document.title, button: btn?.textContent, font: btn && getComputedStyle(btn).fontFamily.split(',')[0], themeColor: !!document.querySelector('meta[name="theme-color"]')?.getAttribute('content') };
  });
  await p.close();
  t('Getting started\'s plain page: standards mode, UTF-8, a title, its Button in Inter inside main, a theme-color', html && r.mode === 'CSS1Compat' && r.charset === 'UTF-8' && r.title && r.button === 'Hello' && r.font === 'Inter' && r.themeColor, html ? JSON.stringify(r) : 'no ```html block under "Or on a plain page"');
  t('Getting started\'s plain page: the font is fetched once, and nothing is logged', fonts.length === 1 && !logged.length, JSON.stringify({ fonts, logged }));

  // 7. The same page and the Back button (FEC6): it leaves and comes back through the back/forward cache (nothing in
  // theme.js, serupa.iife.js or the components keeps it out: no unload listener), and a theme picked in another tab
  // while it was away is applied on return even when the storage event never reaches it, as a cached page may miss
  // it (here theme.js never hears one). Chromium only, and its full build: the headless shell has no
  // back/forward cache, and Playwright turns it off unless asked.
  if (ENGINE === 'chromium') {
    const base = `http://127.0.0.1:${port}`;
    const full = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const ctx = await full.newContext();
    const q = await ctx.newPage();
    // This page hears no storage events at all, as a cached page may not (Chromium does deliver them on return).
    await q.addInitScript(() => {
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, ...rest) { if (this === window && type === 'storage') return; return add.call(this, type, ...rest); };
    });
    await q.goto(`${base}/`);
    await q.waitForFunction(() => !!document.querySelector('#root button'), null, { timeout: 10000 }).catch(() => undefined);
    const before = await q.evaluate(() => { window.__stayed = true; return document.documentElement.getAttribute('data-theme'); });
    await q.goto(`${base}/?away`);
    const other = await ctx.newPage();
    await other.goto(`${base}/?away`);
    await other.evaluate(() => localStorage.setItem('serupa-theme', JSON.stringify({ brand: 'violet', mode: 'dark' })));
    await other.close();
    await q.goBack({ waitUntil: 'commit' });
    await q.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 }).catch(() => undefined);
    const back = await q.evaluate(() => ({ cached: window.__stayed === true, reasons: /** @type {any} */ (performance.getEntriesByType('navigation')[0]).notRestoredReasons, theme: document.documentElement.getAttribute('data-theme') }));
    await full.close();
    t('Getting started\'s plain page: Back brings it from the back/forward cache (nothing blocks it)', back.cached && !back.reasons, JSON.stringify(back.reasons));
    t('theme.js: back from the cache, a theme picked in another tab meanwhile is applied though its storage event never arrived', before !== 'violet-dark' && back.theme === 'violet-dark', `${before} → ${back.theme}`);
  }
  server.close();
}

await b.close();
cleanup();
done(report('Page groundwork', R));
