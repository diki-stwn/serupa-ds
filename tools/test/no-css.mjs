// The page before its CSS (FEC8): every story's server HTML (tools/test/baseline-server/), drawn with no stylesheet,
// as a slow page shows it until bundle.css arrives, or for good when the stylesheet is blocked.
//   - no icon is wider than 2em (an svg with only a viewBox stretches to its container's width: FEC7);
//   - nothing the stylesheet hides shows without it: a closed panel, menu or dialog is hidden by markup (hidden,
//     hidden="until-found", popover, a closed dialog), not by CSS alone, so the page reads right while CSS loads.
// KNOWN lists what still relies on CSS, with why; it can only shrink: an entry nothing matches any more fails too.
//   node tools/test/no-css.mjs   (npm run build first: it compares with dist/bundle.css)
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, browser, cleanup, report, done, tokensCss } from './lib.mjs';

// The class of the outermost element the stylesheet hides, by component, and why it's still CSS alone.
const KNOWN = {
  Accordion: { 'dk-accordion__panel': 'a closed panel is hidden by its clip and visibility in Accordion.css; hidden="until-found" on it would hide it without CSS and let find-in-page open it' },
  CopyButton: { 'dk-copy-btn__label': 'the "Copied" label waits in place, aria-hidden, under visibility: hidden, so the button keeps one width; without CSS both words show' },
};

const DIR = path.join(PROJECT, 'tools', 'test', 'baseline-server');
const TMP = path.join(PROJECT, '.test-tmp');
fs.mkdirSync(TMP, { recursive: true });
fs.writeFileSync(path.join(TMP, 'tokens.test.css'), tokensCss().css);
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

const b = await browser();
const p = await b.newPage();
// Per element (in document order): does it draw something with text in it, and its first class.
const look = () => {
  const all = [...document.body.querySelectorAll('*')];
  const shows = new Map();
  const drawn = (e) => {
    if (shows.has(e)) return shows.get(e);
    const s = getComputedStyle(e);
    // display: contents has no box of its own: it shows when what's in it does.
    const v = s.display === 'contents' ? [...e.children].some(drawn) : e.getClientRects().length > 0 && s.visibility !== 'hidden';
    shows.set(e, v);
    return v;
  };
  return {
    shown: all.map((e) => drawn(e) && !!e.textContent.trim()),
    parent: all.map((e) => all.indexOf(/** @type {Element} */ (e.parentElement))),
    cls: all.map((e) => (e.getAttribute('class') || e.tagName.toLowerCase()).split(' ')[0]),
    wide: [...document.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().width > 2 * parseFloat(getComputedStyle(s).fontSize) + 0.5).map((s) => (s.parentElement?.closest('[class]')?.getAttribute('class') || 'svg').split(' ')[0]),
  };
};
const draw = async (html, css) => {
  const head = css ? '<link rel="stylesheet" href="tokens.test.css"><link rel="stylesheet" href="../dist/bundle.css">' : '';
  const file = path.join(TMP, `no-css-${css ? 'with' : 'without'}.html`);
  fs.writeFileSync(file, `<!doctype html><html data-theme="blue-light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${html}</body></html>`);
  await p.goto('file://' + file);
  return p.evaluate(look);
};

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();
const wide = [], leaks = [], used = new Set();
for (const f of files) {
  const name = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const bare = await draw(html, false), styled = await draw(html, true);
  if (bare.wide.length) wide.push(`${name} (${[...new Set(bare.wide)].join(', ')})`);
  // The outermost elements the stylesheet hides that show without it: their parent shows with the stylesheet.
  const tops = new Set();
  bare.shown.forEach((v, i) => { if (v && !styled.shown[i] && (bare.parent[i] < 0 || styled.shown[bare.parent[i]] || !bare.shown[bare.parent[i]])) tops.add(bare.cls[i]); });
  const fresh = [...tops].filter((c) => { if (KNOWN[name]?.[c]) { used.add(`${name} ${c}`); return false; } return true; });
  if (fresh.length) leaks.push(`${name}: ${fresh.map((c) => `.${c}`).join(', ')}`);
}
await b.close();
cleanup();

t(`with no stylesheet, no icon in the ${files.length} components' stories is wider than 2em`, files.length > 50 && !wide.length,
  files.length <= 50 ? `only ${files.length} server baselines found in tools/test/baseline-server/` : `${wide.join('; ')}: give the svg width="1em" height="1em" (FEC7)`);
t('with no stylesheet, nothing the stylesheet hides shows: closed panels, menus and dialogs are hidden by markup', !leaks.length,
  `${leaks.join('; ')}: hide it with hidden, hidden="until-found", popover or a closed <dialog> as well as the CSS (or, if it must stay CSS alone, add it to KNOWN in tools/test/no-css.mjs with why)`);
const stale = Object.entries(KNOWN).flatMap(([n, cs]) => Object.keys(cs).map((c) => `${n} ${c}`)).filter((k) => !used.has(k));
t('every KNOWN entry still happens (fixed ones come off the list)', !stale.length, `${stale.join('; ')}: remove it from KNOWN in tools/test/no-css.mjs`);

done(report('Before the CSS', R));
