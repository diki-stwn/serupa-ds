// Storybook (npm run build-storybook first): every story and docs page renders without errors, and every
// story passes axe's WCAG 2.2 AA checks in all six themes (text in a disabled control is exempt from
// contrast, as WCAG 1.4.3 says).
//   node tools/test/storybook.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PAGES, PROJECT, browser, inParallel, report, serve, onlyComponents } from './lib.mjs';

const DIR = path.join(PROJECT, 'storybook-static');
if (!fs.existsSync(path.join(DIR, 'index.json'))) {
  // In CI a missing build is a failure, not a skip, so the check can't pass by accident.
  if (process.env.CI) { console.log('FAIL  storybook-static/ is missing (npm run build-storybook)'); process.exit(1); }
  console.log('SKIP  Storybook is not built (npm run build-storybook)'); process.exit(0);
}
const { base, close } = serve(DIR);
const { entries } = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const axe = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const THEMES = ['blue-light', 'blue-dark', 'violet-light', 'violet-dark', 'emerald-light', 'emerald-dark'];

const b = await browser();
// Several pages at once (PAGES), each in its own context, collecting its own page errors.
const workers = await Promise.all(Array.from({ length: PAGES }, async () => {
  const page = await (await b.newContext({ viewport: { width: 1000, height: 800 } })).newPage();
  const w = { page, errors: [] };
  page.on('pageerror', (e) => w.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') w.errors.push(m.text()); });
  return w;
}));
const R = [];
const t = (name, ok, detail) => ({ name, ok: !!ok, detail });

// Opens an entry in a theme and returns what kept it from being ready ('' when it is).
async function open(w, e, theme) {
  const [brand, mode] = theme.split('-');
  const { page } = w;
  w.errors = [];
  // a11y.manual stops the a11y addon's own axe run after each story: it shares window.axe with this check's run.
  await page.goto(`${base}/iframe.html?id=${e.id}&viewMode=${e.type === 'docs' ? 'docs' : 'story'}&globals=brand:${brand};mode:${mode};a11y.manual:!true`);
  const drawn = await page.waitForFunction(() => document.body.classList.contains('sb-show-errordisplay') || document.querySelector('#storybook-root')?.children.length > 0 || document.querySelector('#storybook-docs')?.children.length > 0, null, { timeout: 15000 }).then(() => true, () => false);
  if (!drawn) return 'did not render in 15 s';
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(150);
  return '';
}

// SERUPA_SHARD=2/4 checks every fourth story starting with the second (CI runs the shards in parallel);
// the docs pages are checked in the first shard.
const [shard, shards] = (process.env.SERUPA_SHARD || '1/1').split('/').map(Number);
// SERUPA_ONLY (run.mjs --since on a pull request): only the stories and docs pages of the components it touches.
const only = onlyComponents();
const mine = (e) => !only || only.has(e.importPath.split('/')[3]);   // ./src/components/<Name>/…
const docs = shard === 1 ? Object.values(entries).filter((e) => e.type === 'docs' && mine(e)) : [];
const stories = Object.values(entries).filter((e) => e.type === 'story' && mine(e)).filter((_, i) => i % shards === shard - 1);
async function checkDocs(e, w) {
  const out = [];
  const notReady = await open(w, e, 'blue-light');
  const ok = !notReady && await w.page.evaluate(() => !document.body.classList.contains('sb-show-errordisplay') && (document.querySelector('#storybook-docs')?.textContent || '').trim().length > 50);
  const missing = await w.page.evaluate(() => [...document.querySelectorAll('blockquote')].map((q) => q.textContent).filter((x) => /Missing README section/.test(x)));
  out.push(t(`docs · ${e.title}`, ok && !w.errors.length && !missing.length, [notReady, ...w.errors, ...missing].filter(Boolean).slice(0, 3).join(' | ')));
  // In a dark mode the whole docs page follows the theme, so dark components aren't shown on white.
  const darkNotReady = await open(w, e, 'blue-dark');
  const dark = await w.page.evaluate(() => {
    const bg = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).backgroundColor : null; };
    const want = getComputedStyle(document.body).backgroundColor, text = getComputedStyle(document.querySelector('.sbdocs-content') || document.body).color;
    const off = ['html', '.sbdocs-wrapper', '.sbdocs-preview', '.docs-story'].filter((s) => bg(s) !== null && bg(s) !== want);
    // Code in a dark theme: every syntax color 4.5:1 on its block. Boolean switches: the chosen half still looks
    // different from the other, and both halves read 4.5:1 on what's behind them. (Radios show their state with
    // the native dot.)
    const rgb = (c) => c.match(/[\d.]+/g).map(Number);
    const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const code = [];
    for (const pre of document.querySelectorAll('.docblock-source, .sbdocs-content pre')) {
      const bg = getComputedStyle(pre).backgroundColor;
      for (const sp of pre.querySelectorAll('span')) { if (!sp.textContent.trim()) continue; const r = ratio(getComputedStyle(sp).color, bg); if (r < 4.5) code.push(`${sp.className || 'text'} ${r.toFixed(2)}`); }
    }
    const behind = (el) => { for (; el; el = el.parentElement) { const c = getComputedStyle(el).backgroundColor; if (rgb(c)[3] !== 0) return c; } return want; };
    const looks = (sp) => { const c = getComputedStyle(sp); return [c.backgroundColor, c.color, c.boxShadow].join(); };
    const flat = [];
    for (const l of document.querySelectorAll('.docblock-argstable label:has(> input[role="switch"])')) {
      const [a, b] = l.querySelectorAll(':scope > span');
      if (!a || !b) continue;
      if (looks(a) === looks(b)) flat.push(`${l.getAttribute('aria-label')} same`);
      for (const sp of [a, b]) { const c = getComputedStyle(sp).color, r = rgb(c)[3] === undefined || rgb(c)[3] === 1 ? ratio(c, behind(sp)) : 0; if (r < 4.5) flat.push(`${l.getAttribute('aria-label')} ${sp.textContent} ${r.toFixed(2)}`); }
    }
    return { theme: document.documentElement.getAttribute('data-theme'), want, text, off, code: [...new Set(code)].slice(0, 4), flat: [...new Set(flat)].slice(0, 4) };
  });
  out.push(t(`docs · ${e.title} · dark: the page, story frames, text, code and controls follow the theme`, !darkNotReady && dark.theme === 'blue-dark' && dark.want === 'rgb(9, 9, 11)' && !dark.off.length && dark.text !== 'rgb(46, 52, 56)' && !dark.code.length && !dark.flat.length, darkNotReady || JSON.stringify(dark)));
  return out;
}
async function checkStory(e, w) {
  const out = [];
  const problems = [];
  for (const th of THEMES) {
    const notReady = await open(w, e, th);
    if (notReady) { problems.push(`${th}: ${notReady}`); continue; }
    const shown = await w.page.evaluate((th) => !document.body.classList.contains('sb-show-errordisplay') && document.querySelector('#storybook-root')?.children.length > 0 && document.documentElement.getAttribute('data-theme') === th && getComputedStyle(document.documentElement).backgroundColor === getComputedStyle(document.body).backgroundColor, th);
    if (!shown || w.errors.length) { problems.push(`${th}: ${w.errors[0] || 'did not render'}`); continue; }
    await w.page.addScriptTag({ content: axe });
    const v = await w.page.evaluate(async () => {
      const r = await window.axe.run('#storybook-root', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'] } });
      // WCAG 1.4.3 exempts text that is part of an inactive control: a disabled Field's dimmed label and hint, or the dimmed text in a disabled Input box (PhoneInput's "+62").
      const inactive = (n) => document.querySelector(n.target.join(' '))?.closest('.dk-field--disabled, .dk-input--disabled, :disabled, [aria-disabled="true"]');
      return r.violations.map((x) => ({ ...x, nodes: x.id === 'color-contrast' ? x.nodes.filter((n) => !inactive(n)) : x.nodes }))
        .filter((x) => x.nodes.length).map((x) => `${x.id} (${x.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(', ')})`);
    });
    if (v.length) problems.push(`${th}: ${v.join('; ')}`);
  }
  out.push(t(`${e.title} · ${e.name}: renders and passes WCAG 2.2 AA in all six themes`, !problems.length, problems.slice(0, 3).join('\n      ')));
  return out;
}
R.push(...(await inParallel(docs, workers, checkDocs)).flat(), ...(await inParallel(stories, workers, checkStory)).flat());
await b.close();
close();
console.log(`(${docs.length} docs pages, ${stories.length} stories × ${THEMES.length} themes)`);
process.exit(report('Storybook', R) ? 0 : 1);
