// Storybook (npm run build-storybook first): every story and docs page renders without errors, and every
// story passes axe's WCAG 2.2 AA checks in all six themes, and once more in blue-light with data-contrast="more"
// (text in a disabled control is exempt from contrast, as WCAG 1.4.3 says). In the first theme, each story also
// takes the WCAG 1.4.12 text spacing (line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph
// spacing 2em) and no text may end up cut off by a box that hides its overflow (text ending in an ellipsis is
// shortened on purpose and passes). And at 320 CSS pixels wide (1280 at 400% zoom, WCAG 1.4.10 reflow) the story
// may not make the page scroll sideways; a table, grid or code block that scrolls inside its own box is fine.
//   node tools/test/storybook.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PAGES, PROJECT, browser, fixClock, inParallel, report, serve, onlyComponents } from './lib.mjs';

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
// The more-contrast axis swaps text, border and focus-ring tokens: one more axe run, in the first theme, checks
// that it never takes a story below AA.
const RUNS = [...THEMES, 'blue-light+more'];

const b = await browser();
// Several pages at once (PAGES), each in its own context, collecting its own page errors.
const workers = await Promise.all(Array.from({ length: PAGES }, async () => {
  const context = await b.newContext({ viewport: { width: 1000, height: 800 } });
  await fixClock(context);   // the same today as the screenshots (lib.mjs CLOCK)
  const page = await context.newPage();
  const w = { page, errors: [] };
  page.on('pageerror', (e) => w.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') w.errors.push(m.text()); });
  return w;
}));
const R = [];
const t = (name, ok, detail) => ({ name, ok: !!ok, detail });

// Opens an entry in a theme and returns what kept it from being ready ('' when it is).
async function open(w, e, run) {
  const [theme, contrast = 'default'] = run.split('+');
  const [brand, mode] = theme.split('-');
  const { page } = w;
  w.errors = [];
  // a11y.manual stops the a11y addon's own axe run after each story: it shares window.axe with this check's run.
  await page.goto(`${base}/iframe.html?id=${e.id}&viewMode=${e.type === 'docs' ? 'docs' : 'story'}&globals=brand:${brand};mode:${mode};contrast:${contrast};a11y.manual:!true`);
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
// WCAG 1.4.12's text spacing, as a user's style sheet sets it.
const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
// The text a box with overflow hidden or clip cuts off: for each element with text of its own, the nearest such
// box around it, when the text reaches past its edges. Text cut off with an ellipsis doesn't count.
const cutOff = () => {
  const out = [];
  for (const el of document.querySelectorAll('#storybook-root *')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (!r.width) continue;
    for (let a = el.parentElement; a && a.id !== 'storybook-root'; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (!/hidden|clip/.test(cs.overflowX + cs.overflowY)) continue;
      const box = a.getBoundingClientRect();
      if (box.width < 3 || box.height < 3) break;   // visually hidden text
      const ellipsis = cs.textOverflow === 'ellipsis' || getComputedStyle(el).textOverflow === 'ellipsis';
      if (!ellipsis && (r.right > box.right + 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.top < box.top - 1)) out.push(`"${el.textContent.trim().slice(0, 30)}" in .${String(a.className).split(' ')[0] || a.tagName}`);
      break;
    }
  }
  return [...new Set(out)];
};
// The stories that still scroll sideways at 320px (queue item RF1: a long word or a row of buttons that doesn't
// wrap, or a story with a fixed width).
// One that stops failing fails here too, so the list only shrinks.
const REFLOW_KNOWN = new Set([
  'components-actions-copybutton--with-a-field', 'components-actions-copybutton--variants-and-sizes',
  'components-actions-togglebutton--sizes', 'components-actions-togglegroup--long-labels',
  'components-content-accordion--long-text', 'components-content-highlight--long-text',
  'components-content-icon--common-icons', 'components-content-sortablelist--long-text',
  'components-data-display-timeline--long-text', 'components-feedback-progress--long-label',
  'components-forms-pininput--overflow', 'components-layout-and-type-container--long-text',
  'components-layout-and-type-divider--long-label', 'components-layout-and-type-grid--overflow',
  'components-layout-and-type-stack--overflow', 'components-navigation-navbar--overflow',
  'components-navigation-stepper--narrow', 'components-navigation-stepper--long-labels',
  'components-overlays-menu--submenus', 'guides-serupaprovider--default',
  'guides-serupaprovider--indonesian', 'guides-serupaprovider--nested',
]);
async function checkStory(e, w) {
  const out = [];
  const problems = [];
  for (const th of RUNS) {
    const notReady = await open(w, e, th);
    if (notReady) { problems.push(`${th}: ${notReady}`); continue; }
    const shown = await w.page.evaluate((th) => !document.body.classList.contains('sb-show-errordisplay') && document.querySelector('#storybook-root')?.children.length > 0 && document.documentElement.getAttribute('data-theme') === th.split('+')[0] && (document.documentElement.getAttribute('data-contrast') === 'more') === th.endsWith('+more') && getComputedStyle(document.documentElement).backgroundColor === getComputedStyle(document.body).backgroundColor, th);
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
    if (th === RUNS[0]) {
      await w.page.setViewportSize({ width: 320, height: 256 });
      await w.page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
      const wide = await w.page.evaluate(() => document.documentElement.scrollWidth);
      await w.page.setViewportSize({ width: 1000, height: 800 });
      if ((wide > 321) !== REFLOW_KNOWN.has(e.id)) problems.push(wide > 321 ? `reflow (WCAG 1.4.10): at 320px wide the page scrolls sideways to ${wide}px` : 'reflow: no longer scrolls sideways at 320px; take it out of REFLOW_KNOWN');
      // Only what the spacing cuts off: text already cut off without it is the story's own (a scrolled list).
      const before = await w.page.evaluate(cutOff);
      await w.page.addStyleTag({ content: SPACING });
      await w.page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
      const cut = (await w.page.evaluate(cutOff)).filter((x) => !before.includes(x));
      if (cut.length) problems.push(`text spacing (WCAG 1.4.12) cuts off ${cut.slice(0, 3).join(', ')}`);
    }
  }
  out.push(t(`${e.title} · ${e.name}: renders and passes WCAG 2.2 AA in all six themes and with more contrast, with wider text spacing and at 320px`, !problems.length, problems.slice(0, 3).join('\n      ')));
  return out;
}
R.push(...(await inParallel(docs, workers, checkDocs)).flat(), ...(await inParallel(stories, workers, checkStory)).flat());
await b.close();
close();
console.log(`(${docs.length} docs pages, ${stories.length} stories × ${RUNS.length} runs: six themes and more contrast; text spacing and 320px in the first)`);
process.exit(report('Storybook', R) ? 0 : 1);
