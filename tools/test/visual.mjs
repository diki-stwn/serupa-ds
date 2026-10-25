// Visual snapshots: renders every Storybook story (from storybook-static/, npm run build-storybook) and compares it
// with the saved image in baseline-visual/<Component>/: at rest in every theme, and hovered and focused in the
// first theme (blue-light), and for the components in FORCED once more with forced colors on (Windows High Contrast),
// where states shown only by colour disappear unless the CSS has a forced-colors rule.
//   node tools/test/visual.mjs            check
//   node tools/test/visual.mjs --update   accept the current look as the new baseline (a picture that differs
//                                         only within the tolerance keeps its old file)
//   SERUPA_SHARD=2/3 node tools/test/visual.mjs   every third story, starting with the second (CI runs the shards
//                                                in parallel)
// A story without a baseline fails the check; --update (or the "update-visual-baselines" label) writes one.
// Left out: the Playground stories (the default story with Storybook's controls, which another story shows), the
// components in SKIP, and any story tagged "!visual" (tags: ['!visual'] in its story file).
// Hover and focus act on the element a story marks with data-visual-target (both states), or
// data-visual-target="hover" / ="focus" (one each); without one, hover is on the story's first enabled button, link
// or field, and focus wherever the first Tab lands. Focus comes from pressing Tab, so :focus-visible applies.
// Small anti-aliasing differences between machines are tolerated (TOLERANCE of pixels may differ).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, PAGES, PROJECT, browser, fixClock, inParallel, report, serve, suffix, onlyComponents } from './lib.mjs';

const TOLERANCE = 0.002;          // share of pixels allowed to differ
const DIR = path.join(HERE, `baseline-visual${suffix}`);
const update = process.argv.includes('--update');
const THEMES = ['blue-light', 'blue-dark', 'violet-light', 'violet-dark', 'emerald-light', 'emerald-dark'];
const SKIP = ['VisuallyHidden'];  // nothing to see
// Components whose states (checked, selected, current, progress, drag-over) are easy to lose in forced colors: each
// story is also shot with forced-colors: active, as <Story>-forced-colors.png.
const FORCED = ['Checkbox', 'FileUpload', 'Loader', 'Progress', 'Radio', 'SegmentedControl', 'Slider', 'Switch', 'Table', 'Tabs'];

const SB = path.join(PROJECT, 'storybook-static');
if (!fs.existsSync(path.join(SB, 'index.json'))) {
  console.log('FAIL  storybook-static/ is missing (npm run build-storybook)');
  process.exit(1);
}
const component = (e) => e.importPath.split('/')[3];   // ./src/components/<Name>/<Name>.stories.tsx
const [shard, shards] = (process.env.SERUPA_SHARD || '1/1').split('/').map(Number);
const all = Object.values(JSON.parse(fs.readFileSync(path.join(SB, 'index.json'), 'utf8')).entries)
  .filter((e) => e.type === 'story' && e.exportName !== 'Playground' && !(e.tags || []).includes('!visual') && !SKIP.includes(component(e)))
  .sort((a, b) => a.id.localeCompare(b.id));
// SERUPA_ONLY (run.mjs --since on a pull request): only the stories of the components the change touches.
const only = onlyComponents();
const stories = all.filter((e) => !only || only.has(component(e))).filter((_, i) => i % shards === shard - 1);
// Every baseline a story can have, to find the ones whose story is gone.
const expected = new Set(all.flatMap((e) => [
  ...THEMES.flatMap((th) => ['rest', 'hover', 'focus'].map((s) => `${component(e)}/${e.exportName}-${th}-${s}.png`)),
  ...(FORCED.includes(component(e)) ? [`${component(e)}/${e.exportName}-forced-colors.png`] : []),
]));
const saved = () => fs.readdirSync(DIR, { recursive: true }).map((f) => String(f).split(path.sep).join('/')).filter((f) => f.endsWith('.png') && !f.endsWith('.actual.png'));

const { base, close } = serve(SB);
const b = await browser();
// Several pages at once (PAGES), each in its own context so focus and the pointer stay its own.
const pages = await Promise.all(Array.from({ length: PAGES }, async () => {
  const context = await b.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
  await fixClock(context);   // today is CLOCK, so a story that shows today draws the same picture every day
  return context.newPage();
}));
const R = [];

async function diff(page, a, bb) {   // share of differing pixels, computed in the browser (no image libraries needed)
  return page.evaluate(async ([a, bb]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [x, y] = await Promise.all([load(a), load(bb)]);
    if (x.width !== y.width || x.height !== y.height) return 1;
    const c = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
    const d1 = c(x), d2 = c(y); let n = 0;
    for (let k = 0; k < d1.length; k += 4) if (Math.abs(d1[k] - d2[k]) + Math.abs(d1[k + 1] - d2[k + 1]) + Math.abs(d1[k + 2] - d2[k + 2]) > 24) n++;
    return n / (d1.length / 4);
  }, [a, bb]);
}

// Screenshot once the page has stopped changing: two captures 100 ms apart must match, so a late paint
// (a popover still placing itself, a glyph still loading on a slow runner) can't land in the image.
async function stableShot(page) {
  let last = await page.screenshot({ fullPage: true });
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(100);
    const next = await page.screenshot({ fullPage: true });
    if (next.equals(last)) return next;
    last = next;
  }
  return last;
}

// Focus the way a keyboard does (so :focus-visible applies): press Tab from the top of the page until focus
// is on the element or inside it.
async function tabTo(page, el) {
  const handle = await el.elementHandle();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await handle.evaluate((n) => n.contains(document.activeElement))) return true;
  }
  return false;
}

// Opens a story in a theme, with motion off, once it has drawn and its fonts have loaded. '' when ready.
async function open(page, e, theme) {
  const [brand, mode] = theme.split('-');
  await page.goto(`${base}/iframe.html?id=${e.id}&viewMode=story&globals=brand:${brand};mode:${mode};a11y.manual:!true`);
  const drawn = await page.waitForFunction(() => document.body.classList.contains('sb-show-errordisplay') || document.querySelector('#storybook-root')?.children.length > 0, null, { timeout: 15000 }).then(() => true, () => false);
  if (!drawn) return 'did not render in 15 s';
  if (await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'))) return 'Storybook shows an error';
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  // Every font face loaded, so no glyph draws late.
  await page.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
  await page.waitForTimeout(150);   // stories that open a popover do it on a short timer
  return '';
}

// Shoots the page and compares it with baseline-visual/<name>.png (or writes it, with --update). null when nothing to report.
async function compare(page, name) {
  const shot = await stableShot(page);
  const file = path.join(DIR, `${name}.png`);
  // --update rewrites a baseline only when the new picture differs past the tolerance, so re-rendering on another
  // run doesn't commit hundreds of pictures that only changed in anti-aliasing.
  if (update) {
    if (!fs.existsSync(file) || await diff(page, fs.readFileSync(file).toString('base64'), shot.toString('base64')) > TOLERANCE) fs.writeFileSync(file, shot);
    return null;
  }
  // A missing baseline fails: only --update (or the "update-visual-baselines" label) writes one, so a
  // story can't pass without being compared.
  if (!fs.existsSync(file)) {
    fs.writeFileSync(path.join(DIR, `${name}.actual.png`), shot);
    return { name, ok: false, detail: 'no baseline; add the "update-visual-baselines" label to the pull request (or run node tools/test/visual.mjs --update) and review the new images' };
  }
  const share = await diff(page, fs.readFileSync(file).toString('base64'), shot.toString('base64'));
  if (share > TOLERANCE) fs.writeFileSync(path.join(DIR, `${name}.actual.png`), shot);
  return { name, ok: share <= TOLERANCE, detail: `${(share * 100).toFixed(2)}% of pixels differ; see ${name}.actual.png` };
}

async function checkStory(e, page) {
  const out = [];
  const c = component(e);
  fs.mkdirSync(path.join(DIR, c), { recursive: true });
  for (const th of THEMES) {
    for (const state of th === THEMES[0] ? ['rest', 'hover', 'focus'] : ['rest']) {
      const name = `${c}/${e.exportName}-${th}-${state}`;
      const notReady = await open(page, e, th);
      if (notReady) { out.push({ name, ok: false, detail: notReady }); continue; }
      if (state !== 'rest') {
        // What to hover and focus: the element marked data-visual-target="hover" / ="focus" for this state, else the one
        // marked data-visual-target, else the story's first enabled control (for focus, wherever the first Tab lands in
        // the story, since a radio group or tab list puts its Tab stop on the checked item). A story with none gets no
        // hover or focus shot.
        let el = page.locator(`#storybook-root [data-visual-target="${state}"]`).first();
        if (!(await el.count())) el = page.locator('#storybook-root [data-visual-target]:not([data-visual-target="hover"], [data-visual-target="focus"])').first();
        if (!(await el.count())) el = page.locator('#storybook-root :is(button, a[href], input, select, textarea, [tabindex="0"]):not(:disabled, [aria-disabled="true"]):visible').first();
        if (!(await el.count())) continue;
        if (state === 'focus' && !(await el.evaluate((n) => n.closest('[data-visual-target]')))) el = page.locator('#storybook-root');
        if (state === 'hover') await el.hover({ timeout: 5000 }).catch(() => {});
        else if (!(await tabTo(page, el))) {
          out.push({ name, ok: false, detail: 'Tab never reaches the element to focus; mark one that takes keyboard focus with data-visual-target, or tag the story "!visual"' });
          continue;
        }
      }
      const r = await compare(page, name);
      if (r) out.push(r);
    }
  }
  if (FORCED.includes(c)) {
    // Forced colors replace every colour with the system's few, so one pass is enough (the theme doesn't show).
    const name = `${c}/${e.exportName}-forced-colors`;
    await page.emulateMedia({ forcedColors: 'active' });
    try {
      const notReady = await open(page, e, THEMES[0]);
      const r = notReady ? { name, ok: false, detail: notReady } : await compare(page, name);
      if (r) out.push(r);
    } finally { await page.emulateMedia({ forcedColors: 'none' }); }
  }
  return out;
}
R.push(...(await inParallel(stories, pages, checkStory)).flat());
await b.close();
close();
// A baseline whose story is gone: --update (run whole, not sharded) removes it, and the check fails on it.
const orphans = saved().filter((f) => !expected.has(f) && (!only || only.has(f.split('/')[0])));
if (update) {
  if (shards === 1) for (const f of orphans) fs.rmSync(path.join(DIR, f));
  console.log(`Visual baseline saved: ${stories.length} stories.`);
  process.exit(0);
}
if (shard === 1) R.push({ name: 'every baseline belongs to a story', ok: !orphans.length, detail: `no story for: ${orphans.slice(0, 10).join(', ')}; add the "update-visual-baselines" label to remove them` });
console.log(`(${stories.length} stories)`);
process.exit(report('Visual', R) ? 0 : 1);
