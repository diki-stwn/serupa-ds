// Foundation audit: checks that the system stays self-contained and that everything reads its tokens.
//
//   node tools/test/foundation.mjs [project dir]
//
// Checks
//   1. tokens.json: token names are unique and valid, and plain values hold no var().
//   2. bundle.css stays under 2 MB.
//   3. Every var(--x) in bundle.css names a real token (or a --dk-* internal variable), with no fallback value:
//      tokens.css always loads first, so a fallback would only be a second copy of the token to keep in step.
//      (That component styles read every color through a component token is the Stylelint rule
//      serupa/color-through-component-token.)
//   4. No utility class writes out a value that a token already holds (it should read the token).
//   5. Component styles use no values except tokens and the few listed in ALLOWED_COMPONENT_LITERALS.
//   6. Nothing loads from another server (no http(s) URLs or @import in the shipped CSS/JS).
//   7. tokens.json is exactly what tools/tokens/source.mjs makes from the source, tokens/serupa.tokens.json (and the
//      source turns back into itself), and tokens.css what tools/tokens/build.mjs makes from tokens.json (npm run tokens if not).
//   8. Text, control and focus colors pass WCAG contrast in every theme.
//   9. Responsive variants switch at the screen-* breakpoints.
//  10. base.css reads tokens only.
//  11. One version everywhere (tools/release.mjs --check).
//  12. Every stylesheet puts its rules in the dk.* cascade layers, declared in one order.
//  13. Every width in a media query in src/ (CSS and matchMedia) is a screen-* value (max-width may be value - 0.02px or - 1px).
//  14. One brand list: theme.js, the ThemeBrand type, Storybook's toolbar and the tests' theme lists follow tokens.json.
//  15. Hover styles only inside @media (hover: hover).
//  16. Floating layers don't print; background-only states have a forced-colors fallback.
//  17. Every dk-* class a component stylesheet styles is one the code can produce.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HERE, projectArg, report, done } from './lib.mjs';
import { PAIRS } from '../tokens/contrast-pairs.mjs';
import { toSource, fromSource } from '../tokens/source.mjs';
import { isDeepStrictEqual } from 'node:util';

const P = projectArg();
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });
const read = (f) => fs.readFileSync(path.join(P, f), 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
// A var(...) with up to three levels of nested parentheses.
const VAR = String.raw`var\((?:[^()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))*\)`;

const t = JSON.parse(read('tokens.json'));
// The masks and gradients (utilities-extra.css) are held to the same rules as bundle.css.
const cssRaw = read('dist/bundle.css') + read('dist/utilities-extra.css');
const css = stripComments(cssRaw);
const js = read('dist/serupa.iife.js');

const first = (v) => (v && typeof v === 'object' ? Object.values(v)[0] : v);
const groups = Object.fromEntries(Object.entries(t).filter(([, v]) => v && typeof v === 'object' && Array.isArray(v.tokens)));
const all = Object.values(groups).flatMap((g) => g.tokens);
const TV = new Map(all.map((x) => [x.name, String(first(x.value))]));
const FAM = new Set(Object.keys(t.type.families).map((k) => 'font-' + k));
for (const g of t.type.groups) for (const s of g.styles) FAM.add('text-' + s.name);
const isToken = (n) => TV.has(n) || FAM.has(n);

// 1. tokens.json
const names = all.map((x) => x.name);
const dupes = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))].sort();
check('tokens.json: token names are unique', !dupes.length, dupes.join(', '));
const badn = names.filter((n) => !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(n));
check('tokens.json: token names use letters, digits, - _ .', !badn.length, badn.slice(0, 10).join(', '));
const badv = Object.entries(groups).filter(([k]) => k !== 'color').flatMap(([, g]) => g.tokens).filter((x) => String(first(x.value)).includes('var(')).map((x) => x.name);
check('tokens.json: values are plain values (no var())', !badv.length, badv.slice(0, 10).join(', '));

// 2. size
const size = fs.statSync(path.join(P, 'dist', 'bundle.css')).size;
check('bundle.css is under 2 MB', size < 2 * 1024 * 1024, `${(size / 1048576).toFixed(2)} MB`);

// component tokens (src/components/<Name>/<name>.tokens.json): their CSS variables are overrides with a default
const COMP = new Map();   // css var name (without --) -> [file, token]
for (const c of fs.readdirSync(path.join(P, 'src', 'components')).sort()) {
  for (const f of fs.readdirSync(path.join(P, 'src', 'components', c)).filter((f) => f.endsWith('.tokens.json')).sort()) {
    const rel = `src/components/${c}/${f}`;
    const walk = (tree) => {
      for (const [k, v] of Object.entries(tree)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue;
        if ('$value' in v) COMP.set(v.$extensions['com.serupa'].cssVar.slice(2), [rel, v]);
        else walk(v);
      }
    };
    walk(JSON.parse(read(rel)));
  }
}
const baseFile = path.join(P, 'design-tokens', 'serupa.tokens.json');
const DT_BASE = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : {};
const ALIASES = new Set(groups.color.tokens.filter((x) => x.value && typeof x.value === 'object' && Object.keys(x.value).length > 1).map((x) => x.name));
function compDefault(tok) {
  const v = tok.$value;
  if (v && typeof v === 'object') return v.alpha === 0 ? 'transparent' : null;
  const [grp, name] = [v.slice(1, -1).split('.')[0], v.slice(1, -1).split('.').slice(1).join('.')];
  if (grp === 'color') return ALIASES.has(name) || TV.has(name) ? `var(--${name})` : null;
  const node = (DT_BASE[grp] || {})[name];
  if (!node) return null;
  return `var(--${node.$extensions['com.serupa'].cssVar.slice(2).replace(/[\\.]/g, '\\$&')})`;
}
const norm = (v) => v.trim().replace(/^"|"$/g, '').replace(/"/g, "'").replace(/\s+/g, ' ');

// 3. var() references, with no fallback on a shared token
const missing = new Set(), withFallback = new Set();
for (const m of css.matchAll(/var\(--([A-Za-z0-9\\._-]+)(?:,\s*((?:[^()]|\((?:[^()]|\([^()]*\))*\))*))?\)/g)) {
  const n = m[1].replace(/\\/g, '');
  if (n.startsWith('dk-') || COMP.has(n)) continue;
  if (!isToken(n)) { missing.add(n); continue; }
  if (m[2] != null) withFallback.add(`${n}, ${m[2].trim().slice(0, 30)}`);
}
check('bundle.css: every var() names a token', !missing.size, [...missing].sort().slice(0, 15).join(', '));
check('bundle.css: shared tokens are read with no fallback value', !withFallback.size, [...withFallback].sort().slice(0, 10).join('; '));

// 3b. component tokens: each refers to a shared token, is used, and every use carries exactly its default
const badRef = [], unused = [], wrong = [];
for (const [n, [, tok]] of COMP) {
  const d = compDefault(tok);
  if (d == null) { badRef.push(`${n} → ${JSON.stringify(tok.$value)}`); continue; }
  // Read with no default only as the origin of a relative color (oklch(from var(--x) …)): there, unset is the point.
  const uses = [...css.matchAll(new RegExp(String.raw`var\(--${esc(n)}(?:,\s*((?:[^()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))*))?\)`, 'g'))].filter((m) => !(m[1] == null && /\bfrom\s+$/.test(css.slice(Math.max(0, m.index - 8), m.index)))).map((m) => m[1]);
  if (!uses.length && !tok.$deprecated) unused.push(n);   // a deprecated token may have no effect until it's removed
  // An internal --dk- variable may stand in front of the default (var(--dk-x, default)): one the component works out
  // from another token, such as a hover color from a background that was set (Button, 176).
  const unwrap = (v) => /^var\(--dk-[\w-]+,\s*([\s\S]*)\)$/.exec(v.trim())?.[1] ?? v;
  for (const fb of uses) if (fb == null || norm(unwrap(fb)) !== norm(d)) wrong.push(`${n}: CSS default ${String(fb).trim().slice(0, 50)} ≠ ${d}`);
}
if (COMP.size) {
  check(`component tokens: all ${COMP.size} refer to shared tokens`, !badRef.length, badRef.slice(0, 8).join('; '));
  check('component tokens: every one is used, with exactly the default its tokens file gives', !unused.length && !wrong.length, [...(unused.length ? ['unused: ' + unused.join(', ')] : []), ...wrong.slice(0, 8)].join('; '));
}

// 3c. that component styles read colors through their component tokens is a Stylelint rule
// (serupa/color-through-component-token, tools/lint/stylelint-serupa.mjs), so the editor shows it.

// 4. literal values that a token holds
const EXCEPT = /^-?(shadow|inset-shadow|text-shadow|drop-shadow|rounded(-[a-z]+)?-full)\b/;   // documented exceptions
const lit = [];
for (const m of css.matchAll(/(?:(?<=\} )|(?<=\*\/ )|^)\.(-?[a-z0-9-]+(?:\\[./][0-9a-z]+)?) \{([^{}]*)\}/gm)) {
  const cls = m[1].replace(/\\/g, ''), body = m[2];
  if (cls.startsWith('dk-') || EXCEPT.test(cls)) continue;
  const outside = body.replace(new RegExp(VAR, 'g'), '');
  const parts = cls.replace(/^-/, '').split('-');
  const cands = new Set();
  for (let i = 0; i < parts.length; i++) { cands.add(parts.slice(i).join('-')); cands.add('spacing-' + parts.slice(i).join('-')); }
  const fm = /-(\d+)\/(\d+)$/.exec(cls);
  if (fm) cands.add(`sizing-${fm[1]}-${fm[2]}`);
  for (const n of cands) {
    const v = TV.get(n);
    if (v && !['0', '1', 'none', 'auto', '0px', '100%'].includes(v) && new RegExp(String.raw`(?<![\w.-])${esc(v)}(?![\w.%])`).test(outside)) lit.push(`.${cls} writes ${v} (${n})`);
  }
}
check('utilities: no class writes out a value its token holds', !lit.length, lit.slice(0, 10).join('; '));

// 5. components
const ALLOWED_COMPONENT_LITERALS = new Set(['0', '1em']);   // 0 = none/off, 1em = an icon box that follows its own font size
const comp = [...css.matchAll(/[^{}]*\.dk-[^{}]*\{[^{}]*\}/g)].map((m) => m[0]).join('\n');
const bad = new Set();
for (const [, prop, val] of comp.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
  if (prop.startsWith('--dk')) continue;
  const outside = val.replace(new RegExp(String.raw`var\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)`, 'g'), '');
  for (const [num] of outside.matchAll(/(?<![\w#-])-?\d*\.?\d+(?:px|rem|em|ms|s|%|deg)?(?![\w-])/g))
    if (!ALLOWED_COMPONENT_LITERALS.has(num)) bad.add(`${prop}: ${val.trim().slice(0, 60)}`);
}
check('components: Button and Icon use only tokens', !bad.size, [...bad].sort().slice(0, 10).join('; '));

// 6. self-contained (a link the console warnings print isn't something the page loads: internal/warn.ts)
const LINKS = ['https://github.com/diki-stwn/serupa-ds/blob/main/docs/warnings.md#'];
let extra = '';
for (const f of ['src/styles/base.css', 'src/theme.js']) if (fs.existsSync(path.join(P, f))) extra += read(f);
const ext = [...(cssRaw + js + extra).matchAll(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}\/[^\s"')]*/g)].map((m) => m[0]).filter((u) => !u.startsWith('//') && !LINKS.some((l) => u.startsWith(l)));
check('nothing loads from another server', !ext.length && !(cssRaw + extra).includes('@import'), ext.slice(0, 5).join(', '));

// 8. contrast in every theme (WCAG 2.2: 4.5:1 text, 3:1 large text, icons, borders and focus)
const PAL = new Map(groups.color.tokens.filter((x) => !ALIASES.has(x.name)).map((x) => [x.name, first(x.value)]));
const ALIAS = new Map(groups.color.tokens.filter((x) => ALIASES.has(x.name)).map((x) => [x.name, x.value]));
const THEMES = Object.keys(ALIAS.values().next().value);
const resolve = (name, th) => { const v = ALIAS.has(name) ? ALIAS.get(name)[th] : PAL.get(name); const m = /^\{(.+)\}$/.exec(v); return m ? resolve(m[1], th) : v; };
const lum = (h) => {
  h = h.replace(/^#/, '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
// The pairs live in tools/tokens/contrast-pairs.mjs, which the Foundations/Contrast matrix page shows too.
const known = (n) => ALIAS.has(n) || PAL.has(n);
const low = [];
for (const th of THEMES) for (const [fg, bg, need] of PAIRS) {
  if (!known(fg) || !known(bg)) continue;
  const r = ratio(resolve(fg, th), resolve(bg, th));
  if (r < need) low.push(`${th}: ${fg} on ${bg} ${r.toFixed(2)}:1 (needs ${need})`);
}
check(`contrast: ${PAIRS.length} text, control and focus pairs pass WCAG in all ${THEMES.length} themes`, !low.length, low.slice(0, 8).join('; '));

// 9. responsive variants use the breakpoint tokens
const SCR = Object.fromEntries(groups.layout.tokens.filter((x) => x.name.startsWith('screen-')).map((x) => [x.name.slice(7), x.value]));
const badBp = [...css.matchAll(/@media \(min-width: ([0-9a-z.]+)\) \{ \.([a-z0-9]+)\\:/g)].filter((m) => SCR[m[2]] !== m[1]).map((m) => `${m[2]}: at ${m[1]}, token says ${SCR[m[2]]}`);
check('responsive variants switch at the screen-* breakpoints', !badBp.length, badBp.join('; '));

// 10. base.css reads tokens only
if (fs.existsSync(path.join(P, 'src', 'styles', 'base.css'))) {
  const base = stripComments(read('src/styles/base.css'));
  // A component token (src/components/*/*.tokens.json) counts too: bare links read Link's --link-* tokens.
  const comp = new Set(fs.readdirSync(path.join(P, 'src', 'components')).flatMap((d) => fs.readdirSync(path.join(P, 'src', 'components', d)).filter((f) => f.endsWith('.tokens.json')).flatMap((f) => [...read(`src/components/${d}/${f}`).matchAll(/"cssVar": "--([^"]+)"/g)].map((m) => m[1]))));
  const miss = [...new Set([...base.matchAll(/var\(--([A-Za-z0-9._-]+)/g)].map((m) => m[1]).filter((n) => !isToken(n) && !comp.has(n)))].sort();
  const lits = [];
  for (const [, prop, val] of base.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
    if (prop.endsWith('text-size-adjust')) continue;   // a browser behaviour switch (stop phones inflating text), not a design value
    const out = val.replace(/var\((?:[^()]|\([^()]*\))*\)/g, '');
    if (/(?<![\w#-])\d*\.?\d+(?:px|rem|em|ms|s|%)(?![\w-])/.test(out)) lits.push(`${prop}: ${val.trim()}`);
  }
  check('base.css: every value is a token', !miss.length && !lits.length, [...miss, ...lits].join('; '));
}

// 11. one version everywhere (package.json, file headers, the version export, CHANGELOG)
const rv = spawnSync(process.execPath, [path.join(HERE, '..', 'release.mjs'), '--check'], { encoding: 'utf8' });
check('version: package.json, file headers, the version export and CHANGELOG agree', rv.status === 0, (rv.stdout || '').trim().replace(/\n/g, '; '));

// 7. tokens.css is generated from tokens.json (tools/tokens/build.mjs --check compares it byte for byte)
const tc = spawnSync(process.execPath, [path.join(HERE, '..', 'tokens', 'build.mjs'), '--check', P], { encoding: 'utf8' });
check('tokens.css is exactly what tokens.json gives (npm run tokens if not)', tc.status === 0, ((tc.stdout || '') + (tc.stderr || '')).trim());

// 7. tokens.json is generated from the DTCG source, and the source survives the round trip, so nothing in tokens.json
// is lost in it (tools/tokens/source.mjs)
const sc = spawnSync(process.execPath, [path.join(HERE, '..', 'tokens', 'source.mjs'), '--check', P], { encoding: 'utf8' });
check('tokens.json is exactly what tokens/serupa.tokens.json gives (npm run tokens if not)', sc.status === 0, ((sc.stdout || '') + (sc.stderr || '')).trim());
{
  const src = JSON.parse(read('tokens/serupa.tokens.json'));
  check('tokens/serupa.tokens.json turns into tokens.json and back without a change', isDeepStrictEqual(toSource(fromSource(src).tokens), src));
}

// 12. cascade layers: every shipped stylesheet declares the same layer order and keeps its rules inside its layer
const ORDER = '@layer dk.tokens, dk.base, dk.components, dk.utilities;';
const layered = { 'tokens.css': 'dk.tokens', 'dist/base.css': 'dk.base', 'dist/components.css': 'dk.components', 'dist/utilities.css': 'dk.utilities', 'dist/utilities-extra.css': 'dk.utilities' };
const unlayered = [];
for (const [f, layer] of Object.entries(layered)) {
  const body = stripComments(read(f)).trim();
  if (!body.startsWith(ORDER)) { unlayered.push(`${f}: doesn't start with "${ORDER}"`); continue; }
  // Outside the layer blocks there may only be the order statement, @font-face and @property (page-wide either way).
  let rest = body.slice(ORDER.length), depth = 0, outside = '';
  for (let i = 0; i < rest.length; i++) {
    if (depth === 0 && rest.startsWith(`@layer ${layer} {`, i)) { depth = 1; i += `@layer ${layer} {`.length - 1; continue; }
    if (depth > 0) { if (rest[i] === '{') depth++; else if (rest[i] === '}') depth--; continue; }
    outside += rest[i];
  }
  outside = outside.replace(/@(font-face|property [\w-]+)\s*\{[^}]*\}/g, '').trim();
  if (outside) unlayered.push(`${f}: rules outside @layer ${layer}: ${outside.slice(0, 60)}`);
}
check('cascade layers: tokens, base, components and utilities each sit in their dk.* layer, in one order', !unlayered.length, unlayered.join('; '));

// 13. component breakpoints: every width in a media query is a screen-* value. CSS variables don't work inside
// @media, so the values are written out; this keeps them in step with the tokens. min-width (and width >= / >)
// must be a token value; max-width (and width <= / <) may also end just below one: value - 0.02px (the
// convention here, e.g. 767.98px) or value - 1px. Covers the CSS in src/ and matchMedia() strings in the source.
const SCREENS = groups.layout.tokens.filter((x) => x.name.startsWith('screen-')).map((x) => [x.name, parseFloat(x.value)]);
const srcFiles = (dir) => fs.readdirSync(path.join(P, dir), { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? srcFiles(path.join(dir, d.name)) : /\.(css|tsx?|js)$/.test(d.name) && !/\.(stories|test)\.tsx?$/.test(d.name) ? [path.join(dir, d.name)] : []);
const badMq = [];
let mqCount = 0;
for (const f of srcFiles('src')) {
  const text = stripComments(read(f));
  const preludes = f.endsWith('.css')
    ? [...text.matchAll(/@media([^{;]*)\{/g)].map((m) => m[1])
    : [...text.matchAll(/matchMedia\(\s*(["'`])(.*?)\1/g)].map((m) => m[2]);
  for (const pre of preludes) for (const [feat] of pre.matchAll(/\([^()]*\bwidth\b[^()]*\)/g)) {
    if (/device-width|aspect/.test(feat)) { badMq.push(`${f}: ${feat} (use min-width / max-width)`); continue; }
    let m, kind, num, unit;
    if ((m = /^\(\s*(min|max)-width\s*:\s*([\d.]+)([a-z]*)\s*\)$/.exec(feat))) [, kind, num, unit] = m;
    else if ((m = /^\(\s*width\s*(>=?|<=?)\s*([\d.]+)([a-z]*)\s*\)$/.exec(feat))) { kind = m[1][0] === '>' ? 'min' : 'max'; [, , num, unit] = m; }
    else if ((m = /^\(\s*([\d.]+)([a-z]*)\s*(<=?|>=?)\s*width\s*\)$/.exec(feat))) { kind = m[3][0] === '<' ? 'min' : 'max'; [, num, unit] = m; }
    else { badMq.push(`${f}: ${feat} (not a form this check reads)`); continue; }
    mqCount++;
    const v = parseFloat(num);
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    const ok = unit === 'px' && SCREENS.some(([, s]) => near(v, s) || (kind === 'max' && (near(v, s - 0.02) || near(v, s - 1))));
    if (!ok) badMq.push(`${f}: ${feat} is not a screen-* value (${SCREENS.map(([n, s]) => `${n} ${s}px`).join(', ')})`);
  }
}
check(`breakpoints: all ${mqCount} widths in media queries are screen-* values`, !badMq.length && mqCount > 0, badMq.slice(0, 10).join('; '));

// 14. one brand list: tokens.json's color.themes ("<brand>-<mode>") is the source. Storybook's toolbar reads it
// directly; theme.js, the ThemeBrand type and the theme lists written out in the tests must name the same brands
// and themes, in the same order. Each brand needs a light and a dark theme, since theme.js puts the two together.
const THEME_IDS = t.color.themes.map((x) => x.id);
const BRANDS = [...new Set(THEME_IDS.map((id) => id.replace(/-(light|dark)$/, '')))];
const brandIssues = [];
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const badIds = THEME_IDS.filter((id) => !/^[a-z][a-z0-9]*-(light|dark)$/.test(id));
if (badIds.length) brandIssues.push(`tokens.json: theme ids must be <brand>-light or <brand>-dark: ${badIds.join(', ')}`);
const pairs = BRANDS.flatMap((b) => [`${b}-light`, `${b}-dark`]);
if (!same([...THEME_IDS].sort(), [...pairs].sort())) brandIssues.push(`tokens.json: each brand needs exactly a light and a dark theme (has ${THEME_IDS.join(', ')})`);
const listOf = (s) => [...s.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
const themeJs = read('src/theme.js');
const jsBrands = /var BRANDS = \[([^\]]*)\]/.exec(themeJs);
if (!jsBrands) brandIssues.push('src/theme.js: no "var BRANDS = [...]" found');
else if (!same(listOf(jsBrands[1]), BRANDS)) brandIssues.push(`src/theme.js: BRANDS is [${listOf(jsBrands[1]).join(', ')}], tokens.json gives [${BRANDS.join(', ')}]`);
const jsDoc = /data-brand\s+([a-z0-9 |]+?)\s+\(default: ([a-z0-9]+)\)/.exec(themeJs);
if (!jsDoc || !same(jsDoc[1].split('|').map((s) => s.trim()), BRANDS) || jsDoc[2] !== BRANDS[0]) brandIssues.push(`src/theme.js: the header should read "data-brand  ${BRANDS.join(' | ')}  (default: ${BRANDS[0]})"`);
const jsDefault = /pick\(root\.getAttribute\("data-brand"\), BRANDS, "([^"]+)"\)/.exec(themeJs);
if (!jsDefault || jsDefault[1] !== BRANDS[0]) brandIssues.push(`src/theme.js: the default brand should be "${BRANDS[0]}" (the first theme's brand)`);
const tsType = /export type ThemeBrand\s*=\s*([^;]+);/.exec(read('src/theme-types.ts'));
if (!tsType) brandIssues.push('src/theme-types.ts: no ThemeBrand type found');
else if (!same(listOf(tsType[1]), BRANDS)) brandIssues.push(`src/theme-types.ts: ThemeBrand is ${listOf(tsType[1]).join(' | ')}, tokens.json gives ${BRANDS.map((b) => `'${b}'`).join(' | ')}`);
if (fs.existsSync(path.join(P, '.storybook', 'preview.tsx')) && !read('.storybook/preview.tsx').includes("from '../tokens.json'"))
  brandIssues.push('.storybook/preview.tsx: the toolbar should take the brands from tokens.json');
// Theme lists written out in the tests: any array of two or more "<brand>-light|dark" strings must be the whole list.
const testFiles = (dir) => fs.readdirSync(path.join(P, dir), { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? (d.name.startsWith('baseline') ? [] : testFiles(path.join(dir, d.name))) : /\.(mjs|ts|tsx)$/.test(d.name) ? [path.join(dir, d.name)] : []);
let lists = 0;
for (const f of testFiles(path.join('tools', 'test'))) {
  for (const m of read(f).matchAll(/\[\s*((?:['"][a-z0-9]+-(?:light|dark)['"]\s*,\s*)+['"][a-z0-9]+-(?:light|dark)['"])\s*,?\s*\]/g)) {
    lists++;
    if (!same(listOf(m[1]), THEME_IDS)) brandIssues.push(`${f}: theme list [${listOf(m[1]).join(', ')}] differs from tokens.json`);
  }
}
check(`one brand list: theme.js, ThemeBrand, Storybook and ${lists} theme lists in the tests follow tokens.json (${BRANDS.length} brands, ${THEME_IDS.length} themes)`, !brandIssues.length, brandIssues.slice(0, 8).join('; '));

// 15. hover only where there is hover: on a touch screen the browser keeps :hover on the last element tapped, so a
// hover color would stick ("still selected"). Every :hover rule sits inside @media (hover: hover); :active still
// gives a tap its feedback.
const sticky = [];
for (const f of ['dist/base.css', 'dist/components.css']) {
  const body = stripComments(read(f)), stack = [];
  let prelude = '';
  for (const ch of body) {
    if (ch === '{') { stack.push(prelude.trim()); prelude = ''; }
    else if (ch === '}') { stack.pop(); prelude = ''; }
    else if (ch === ';') prelude = '';
    else prelude += ch;
    if (ch === '{' && /:hover/.test(stack[stack.length - 1]) && !stack.some((p) => /^@media[^{]*\(hover:\s*hover\)/.test(p))) sticky.push(`${f}: ${stack[stack.length - 1].slice(0, 80)}`);
  }
}
check('hover styles apply only with a pointer that hovers: every :hover rule is inside @media (hover: hover)', !sticky.length, sticky.slice(0, 6).join('; '));

// 16. print and forced colors, per component stylesheet (V5): the lists in base.css are kept by hand, so these say
// when a new component needs a line. A layer that floats over the page (position: fixed, or a popover) mustn't print
// on every page: it is in base.css's print list, or has its own @media print. Dialog and Drawer are the exception:
// an open one is what the reader is looking at, so it prints. And a state that only changes the background
// (--active, --selected, --checked, --over, --current, --pressed) vanishes in forced colors, where backgrounds are the
// system's: such a rule also changes a border, outline, color or text decoration, or the file has a forced-colors
// rule for that class.
const PRINTS = new Set(['Dialog', 'Drawer']);
const baseCss = stripComments(read('src/styles/base.css'));
const printBlock = (baseCss.match(/@media print\s*\{([\s\S]*?)\n\}/) || ['', ''])[1];
const printHidden = new Set([...printBlock.matchAll(/:where\(([^)]*)\)\s*\{\s*display:\s*none/g)].flatMap((w) => [...w[1].matchAll(/\.(dk-[\w-]+)/g)].map((m) => m[1])));
const floating = [], fadesInForcedColors = [];
for (const n of fs.readdirSync(path.join(P, 'src', 'components')).sort()) {
  const f = path.join('src', 'components', n, `${n}.css`);
  if (!fs.existsSync(path.join(P, f))) continue;
  const css = stripComments(read(f));
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
  const fixed = rules.filter(([, b]) => /(?:^|;)\s*position:\s*fixed/.test(b)).map(([sel]) => sel);
  const pops = /\[popover\]|:popover-open|popover/.test(rules.map(([sel]) => sel).join(' ')) ? ['popover'] : [];
  if ((fixed.length || pops.length) && !PRINTS.has(n) && !/@media print/.test(css)) {
    const own = [...new Set(rules.map(([sel]) => (sel.match(/^\.(dk-[\w-]+)/) || [])[1]).filter(Boolean))];
    // .dk-fab--bottom-end is hidden by .dk-fab in the list (a modifier's element carries the base class too).
    if (!own.some((c) => printHidden.has(c) || printHidden.has(c.replace(/(--|__).*$/, '')))) floating.push(`${n} (${[...fixed, ...pops][0].slice(0, 40)})`);
  }
  const forced = (css.match(/@media[^{]*forced-colors[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g) || []).join(' ');
  for (const [sel, body] of rules) {
    for (const c of new Set([...sel.matchAll(/\.(dk-[\w-]+--(?:active|selected|checked|over|current|pressed))\b/g)].map((m) => m[1]))) {
      if (/(?:^|;)\s*background(?:-color)?\s*:/.test(body) && !/(?:^|;)\s*(?:border[\w-]*|outline[\w-]*|color|text-decoration[\w-]*|box-shadow|font-weight)\s*:/.test(body) && !forced.includes(c)) fadesInForcedColors.push(`${n}: .${c}`);
    }
  }
}
check('print: every component that floats over the page (position: fixed, popover) is hidden when printing (base.css print list or its own @media print), apart from Dialog and Drawer', !floating.length, floating.join('; '));
check('forced colors: every state that only changes the background also changes a border, outline or color, or has a forced-colors rule', !fadesInForcedColors.length, [...new Set(fadesInForcedColors)].join('; '));

// 17. no dead component CSS (idea 80): every dk-* class a component stylesheet styles is one the code can produce:
// written out ("dk-btn__label"), built from a prefix the code joins ("dk-loader__px--d" + n, `dk-tag--${tone}`), or
// ending in a piece the code joins on ("dk-" + name + "__ripple"). A class nothing produces is a rule that never applies.
const sources = srcFiles('src').filter((f) => /\.tsx?$/.test(f)).map((f) => read(f)).join('\n')
  + fs.readdirSync(path.join(P, 'src', 'components')).flatMap((n) => fs.existsSync(path.join(P, 'src', 'components', n, 'preview.html')) ? [read(path.join('src', 'components', n, 'preview.html'))] : []).join('\n');
const written = new Set(sources.match(/dk-[a-z0-9_-]+/g) || []);
const joined = [...sources.matchAll(/(?<![a-z0-9_-])(dk-[a-z0-9_-]*)(?:["']\s*\+|\$\{)/g)].map((m) => m[1]).filter((pre) => pre.length > 3);   // not "dk-" alone
const tails = [...sources.matchAll(/(?:\+\s*["']|\}`?)((?:__|--)[a-z0-9_-]+)/g)].map((m) => m[1]);
const dead = [];
for (const n of fs.readdirSync(path.join(P, 'src', 'components')).sort()) {
  const f = path.join('src', 'components', n, `${n}.css`);
  if (!fs.existsSync(path.join(P, f))) continue;
  for (const c of new Set([...stripComments(read(f)).matchAll(/\.(dk-[a-z0-9_-]+)/g)].map((m) => m[1]))) {
    if (!written.has(c) && !joined.some((pre) => c.startsWith(pre)) && !tails.some((t) => c.endsWith(t))) dead.push(`${n}: .${c}`);
  }
}
check('no dead component CSS: every dk-* class in a component stylesheet is one its code can produce', !dead.length, dead.slice(0, 12).join('; '));

done(report('Foundation', results));
