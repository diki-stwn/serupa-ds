// Browser baseline: every property, value keyword, function, at-rule and pseudo-class in dist/bundle.css (and in
// dist/utilities-extra.css, its masks and gradients), and every
// static built-in dist/serupa.iife.js reads, works in the oldest browsers the README's "Browser support" names
// (BASELINE), going by MDN's browser-compat-data.
//
//   node tools/test/browser-baseline.mjs
//
// Something newer is fine when it degrades well, but it has to be said: it goes in KNOWN with what happens without
// it, and when the README should tell users (a class that does nothing there), README names it. So a new feature
// that needs a newer browser fails here until someone decides it may, and an entry the data no longer needs fails
// too, so the list stays the true one. Also fails on a property the data doesn't know (a typo, or a non-standard
// one), and on an @supports every baseline browser passes. Skipped: custom properties, vendor-prefixed properties
// and pseudo-elements (each meant for its own engine), and a declaration inside an @supports that tests that same
// property (it already asks first). A prefixed form in the same rule counts as support, as -webkit-user-select
// does for Safari.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import bcd from '@mdn/browser-compat-data' with { type: 'json' };
import { projectArg, report, done, fail } from './lib.mjs';

const P = projectArg();
// The README's floor: light-dark() needs Chrome and Edge 123 and Safari 17.5; @property, which every utility that
// composes through --dk-* variables (transforms, shadows, rings, gradients, filters, masks) needs for its starting
// values, needs Firefox 128.
const BASELINE = { chrome: 123, edge: 123, safari: 17.5, firefox: 128 };

// Newer than BASELINE, on purpose. The key is what the scan prints; the value says what happens without it.
// readme: text the README's "Browser support" section has to contain, for what users should know.
const KNOWN = {
  // Progressive: without them, a page works and looks the same or near enough.
  '@starting-style': { why: 'entry fades and slides (Firefox 129): elements appear without them' },
  'property transition-behavior': { why: 'exit animations of discrete properties (Firefox 129): elements leave without them' },
  'transition-behavior: allow-discrete': { why: 'as transition-behavior' },
  'transition-behavior: normal': { why: 'as transition-behavior' },
  'property content-visibility': { why: 'Accordion panels (Safari 18): closed content is also hidden="until-found", so it stays hidden' },
  'content-visibility: hidden': { why: 'as content-visibility' },
  'content-visibility: visible': { why: 'as content-visibility' },
  'property animation-range': { why: 'scroll-driven animations are progressive and behind @supports (animation-timeline: scroll()): a sticky Navbar keeps its line and lifts with no shadow' },
  'property view-transition-name': { why: 'view transitions are progressive: the change happens without the animation' },
  'view-transition-name: none': { why: 'as view-transition-name' },
  'view-transition-name: match-element': { why: 'as view-transition-name' },
  'text-wrap: pretty': { why: 'line breaking only (Safari 26, not Firefox)' },
  'property hyphenate-limit-chars': { why: 'Card, Alert and Toast hyphenate only words of 10 letters or more (not Safari, nor Firefox before 137): shorter words hyphenate too there' },
  'property scrollbar-gutter': { why: 'Dialog and Drawer keep the page from shifting (Safari 18.2): the page shifts by the scrollbar width there' },
  'scrollbar-gutter: stable': { why: 'as scrollbar-gutter' },
  'scrollbar-gutter: auto': { why: 'as scrollbar-gutter' },
  'property scrollbar-width': { why: 'Tabs hide the tab list\'s scrollbar (Safari 18.2); macOS overlay scrollbars show only while scrolling' },
  'scrollbar-width: none': { why: 'as scrollbar-width' },
  'scrollbar-width: auto': { why: 'as scrollbar-width' },
  'scrollbar-width: thin': { why: 'as scrollbar-width' },
  'property scrollbar-color': { why: 'scrollbar colors (Safari 26.2): the browser\'s own scrollbar' },
  'property forced-color-adjust': { why: 'Safari has no forced colors mode, so there is nothing to adjust' },
  'forced-color-adjust: none': { why: 'as forced-color-adjust' },
  'forced-color-adjust: auto': { why: 'as forced-color-adjust' },
  'property overflow-anchor': { why: 'VirtualList turns the browser\'s scroll anchoring off to keep its own (Safari has none): there is nothing to turn off' },
  'overflow-anchor: none': { why: 'as overflow-anchor' },
  'break-before: avoid': { why: 'print and column breaks: a hint browsers may ignore' },
  'break-before: avoid-page': { why: 'as break-before: avoid' },
  'break-before: column': { why: 'as break-before: avoid' },
  'break-after: avoid': { why: 'as break-before: avoid' },
  'break-after: avoid-page': { why: 'as break-before: avoid' },
  'break-after: column': { why: 'as break-before: avoid' },
  // The data says no; the cross-browser test (compat.mjs) measured these working in WebKit.
  'mask-clip: border-box': { why: 'compat.mjs: works in WebKit' },
  'mask-clip: padding-box': { why: 'compat.mjs: works in WebKit' },
  'mask-clip: content-box': { why: 'compat.mjs: works in WebKit' },
  'mask-clip: no-clip': { why: 'compat.mjs: works in WebKit' },
  'mask-origin: border-box': { why: 'compat.mjs: works in WebKit' },
  'mask-origin: padding-box': { why: 'compat.mjs: works in WebKit' },
  'mask-origin: content-box': { why: 'compat.mjs: works in WebKit' },
  // Classes that do nothing in some browsers: the README's table lists them.
  'mask-clip: fill-box': { why: 'Safari', readme: '`mask-clip-fill`' },
  'mask-clip: stroke-box': { why: 'Safari', readme: '`mask-clip-fill`' },
  'mask-clip: view-box': { why: 'Safari', readme: '`mask-clip-fill`' },
  'mask-origin: fill-box': { why: 'Safari', readme: 'same `mask-origin-*`' },
  'mask-origin: stroke-box': { why: 'Safari', readme: 'same `mask-origin-*`' },
  'mask-origin: view-box': { why: 'Safari', readme: 'same `mask-origin-*`' },
  'mix-blend-mode: plus-darker': { why: 'Safari only', readme: '`mix-blend-plus-darker`' },
  'align-content: safe': { why: 'Safari 17.6', readme: '`*-safe`' },
  'align-items: safe': { why: 'Safari 17.6', readme: '`*-safe`' },
  'align-self: safe': { why: 'Safari 17.6', readme: '`*-safe`' },
  'justify-content: safe': { why: 'Safari 17.6', readme: '`*-safe`' },
  'property field-sizing': { why: 'Textarea asks @supports first and measures in script elsewhere', readme: '`field-sizing-*`' },
  'field-sizing: fixed': { why: 'as field-sizing', readme: '`field-sizing-*`' },
  'field-sizing: content': { why: 'as field-sizing', readme: '`field-sizing-*`' },
};

const file = path.join(P, 'dist', 'bundle.css');
if (!fs.existsSync(file)) fail('dist/bundle.css is missing: run npm run build first');
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const version = (v) => (v === true ? 0 : typeof v === 'string' && /^[≤\d]/.test(v) ? parseFloat(v.replace('≤', '')) : Infinity);
// The browsers in BASELINE that lack it, as "safari 18" (where it arrived) or "firefox no".
function gaps(compat, prefixes = new Set()) {
  const out = [];
  for (const [b, floor] of Object.entries(BASELINE)) {
    const s = compat?.support?.[b];
    const list = (Array.isArray(s) ? s : s ? [s] : []).filter((x) => !x.flags && !x.alternative_name && (!x.prefix || prefixes.has(x.prefix)));
    const ok = list.some((x) => version(x.version_added) <= floor && (!x.version_removed || version(x.version_removed) > floor));
    if (!ok) out.push(`${b} ${list[0]?.version_added || 'no'}`);
  }
  return out;
}

const found = new Map();
const unknown = new Set();
const note = (key, compat, where, prefixes) => {
  const g = gaps(compat, prefixes);
  if (g.length && !found.has(key)) found.set(key, `${key} (${g.join(', ')}; e.g. ${where})`);
};
const asksFirst = (node, prop) => { for (let n = node.parent; n; n = n.parent) if (n.type === 'atrule' && n.name === 'supports' && n.params.includes(prop)) return true; return false; };
const css = postcss.parse(fs.readFileSync(file, 'utf8') + fs.readFileSync(path.join(P, 'dist', 'utilities-extra.css'), 'utf8'));
const types = Object.entries(bcd.css.types);
css.walkDecls((d) => {
  if (d.prop.startsWith('--') || d.prop.startsWith('-') || d.parent.type === 'atrule' || asksFirst(d, d.prop)) return;
  const p = bcd.css.properties[d.prop];
  if (!p) { unknown.add(`${d.prop} (${d.parent.selector})`); return; }
  const prefixes = new Set();
  d.parent.each((n) => { const m = n.type === 'decl' && n.prop.match(/^(-webkit-|-moz-)(.*)$/); if (m && m[2] === d.prop) prefixes.add(m[1]); });
  const where = d.parent.selector;
  note(`property ${d.prop}`, p.__compat, where, prefixes);
  for (const w of new Set(d.value.split(/[\s,()/]+/))) if (w !== '__compat' && p[w]?.__compat) note(`${d.prop}: ${w}`, p[w].__compat, where, prefixes);
  for (const [, f] of d.value.matchAll(/([a-z-]+)\(/g)) {
    const t = bcd.css.types[f]?.__compat ? bcd.css.types[f] : types.find(([, x]) => x[f]?.__compat)?.[1][f];
    if (t) note(`${f}()`, t.__compat, where);
  }
});
css.walkAtRules((a) => {
  const r = bcd.css['at-rules'][a.name];
  if (r) note(`@${a.name}`, r.__compat, `@${a.name} ${a.params}`.trim().slice(0, 60));
});
// An @supports whose every test the baseline passes guards nothing: its fallback is dead code to keep in step.
// Only plain (property: value) tests count; not(), selector() and vendor-prefixed tests always may stay.
const redundant = new Set();
css.walkAtRules('supports', (a) => {
  if (/\bnot\b|selector\(|\(\s*-/.test(a.params)) return;
  const tests = [...a.params.matchAll(/\(\s*([a-z-]+)\s*:\s*([^()]*(?:\([^()]*\)[^()]*)*)\)/g)];
  if (!tests.length) return;
  const passes = tests.every(([, prop, value]) => {
    const p = bcd.css.properties[prop];
    if (!p || gaps(p.__compat).length) return false;
    if (value.split(/[\s,()/]+/).some((w) => w !== '__compat' && p[w]?.__compat && gaps(p[w].__compat).length)) return false;
    return [...value.matchAll(/([a-z-]+)\(/g)].every(([, f]) => {
      const t = bcd.css.types[f]?.__compat ? bcd.css.types[f] : types.find(([, x]) => x[f]?.__compat)?.[1][f];
      return !t || !gaps(t.__compat).length;
    });
  });
  if (passes) redundant.add(`@supports ${a.params}`);
});
css.walkRules((r) => {
  for (const [, name] of r.selector.matchAll(/::?([a-z][a-z-]*)/g)) if (bcd.css.selectors[name]) note(`:${name}`, bcd.css.selectors[name].__compat, r.selector.slice(0, 60));
});

check('bundle.css: every property is a known CSS property', !unknown.size, [...unknown].slice(0, 10).join('; '));
const fresh = [...found.keys()].filter((k) => !KNOWN[k]).sort();
check(`bundle.css works in Chrome and Edge ${BASELINE.chrome}, Safari ${BASELINE.safari} and Firefox ${BASELINE.firefox}, apart from KNOWN`, !fresh.length,
  fresh.map((k) => found.get(k)).join('\n      ') + '\n      Make it work there, or add it to KNOWN in tools/test/browser-baseline.mjs with what happens without it.');
const stale = Object.keys(KNOWN).filter((k) => !found.has(k)).sort();
check('No @supports tests for what the baseline already has', !redundant.size, `${[...redundant].join('; ')}: drop the @supports and the fallback before it`);
// The script side: every static built-in it reads (Object.groupBy, Promise.withResolvers, Intl.Segmenter, …) in the
// IIFE, which holds every component, works at the baseline too. Prototype methods can't be told apart by name
// (an array's .filter() from an iterator's), so they are left to the cross-browser runs.
const KNOWN_JS = {};
const js = fs.readFileSync(path.join(P, 'dist', 'serupa.iife.js'), 'utf8');
const B = bcd.javascript.builtins;
const newJs = new Map();
for (const [, g, m] of js.matchAll(/\b([A-Z][A-Za-z]+)\.([a-zA-Z]+)\b/g)) {
  const c = g === 'Intl' ? B.Intl?.[m]?.__compat : B[g]?.[m]?.__compat;
  if (!c) continue;
  const gp = gaps(c);
  if (gp.length) newJs.set(`${g}.${m}`, gp.join(', '));
}
const freshJs = [...newJs.keys()].filter((k) => !KNOWN_JS[k]).sort();
check(`serupa.iife.js: every static built-in works at the baseline, apart from KNOWN_JS`, !freshJs.length, freshJs.map((k) => `${k} (${newJs.get(k)})`).join('; ') + ': guard it and add it to KNOWN_JS with what happens without it');
check('KNOWN lists only what the baseline lacks', !stale.length, `${stale.join(', ')}: take out of KNOWN`);
const readme = fs.readFileSync(path.join(P, 'README.md'), 'utf8').split('## Browser support')[1]?.split('\n## ')[0] || '';
const missing = [...new Set(Object.values(KNOWN).map((k) => k.readme).filter((r) => r && !readme.includes(r)))];
check('The README\'s "Browser support" names the classes that do nothing in some browsers', !missing.length, missing.join(', '));
const floors = [`Chrome and Edge ${BASELINE.chrome}`, `Safari ${BASELINE.safari}`, `Firefox ${BASELINE.firefox}`].filter((f) => !readme.includes(f));
check('The README states the same baseline', !floors.length, `missing: ${floors.join(', ')}`);

done(report('Browser baseline', results));
