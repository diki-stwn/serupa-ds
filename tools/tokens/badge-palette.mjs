// Writes Badge's palette tones in Badge.css from the color palette in tokens.json (F15), so the 17 chromatic
// families, their steps and the status tones can't drift from the palette or from each other. The rules sit between
// two markers in Badge.css:
//   /* badge-palette:start (made from tokens.json by npm run tokens: edit tools/tokens/badge-palette.mjs) */
//   …
//   /* badge-palette:end */
// The families are the palette's, without the grays. The steps, checked for contrast by Badge.test.tsx:
//   light: subtle 100 fill + 700 text; solid 600 + white where white reads 4.5:1 on 600, else 700; outline 700.
//   dark: subtle 950 fill + 300 text; solid 400 + 950 text; outline 300 text on a 400 border.
// Three blocks set them: the light themes (and a page with no theme), the dark ones, and light-dark() pairs for the
// data-brand and data-mode axes, which follow the element's color-scheme.
//   node tools/tokens/badge-palette.mjs           rewrite the rules
//   node tools/tokens/badge-palette.mjs --check   exit 1 when Badge.css is out of date
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CSS = path.join(ROOT, 'src', 'components', 'Badge', 'Badge.css');
const START = '/* badge-palette:start (made from tokens.json by npm run tokens: edit tools/tokens/badge-palette.mjs) */';
const END = '/* badge-palette:end */';
const GRAYS = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone']);
// The status tones, by the family each reads.
export const STATUS = { success: 'green', warning: 'amber', danger: 'red', info: 'sky' };

const hexOf = (colors, name) => {
  const t = colors.find((c) => c.name === name);
  const v = t && Object.values(t.value)[0];
  if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`tokens.json: no hex value for ${name}`);
  return v;
};
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// The palette's chromatic families, in its order, each with its light solid fill step.
export function families(tokens) {
  const colors = tokens.color.tokens;
  const white = hexOf(colors, 'white');
  return colors.map((c) => /^([a-z]+)-500$/.exec(c.name)?.[1]).filter((f) => f && !GRAYS.has(f))
    .map((f) => ({ name: f, solid: ratio(hexOf(colors, `${f}-600`), white) >= 4.5 ? 600 : 700 }));
}

export function rules(tokens) {
  const fams = families(tokens);
  const v = (s) => `var(--${s})`;
  const set = (pick) => fams.map((f) => {
    const s = pick(f);
    return `--dk-bdg-${f.name}-sbg: ${s.sbg}; --dk-bdg-${f.name}-sfg: ${s.sfg}; --dk-bdg-${f.name}-xbg: ${s.xbg}; --dk-bdg-${f.name}-xfg: ${s.xfg}; --dk-bdg-${f.name}-o: ${s.o}; --dk-bdg-${f.name}-obd: ${s.obd};`;
  }).join(' ');
  const light = (f) => ({ sbg: v(`${f.name}-100`), sfg: v(`${f.name}-700`), xbg: v(`${f.name}-${f.solid}`), xfg: v('white'), o: v(`${f.name}-700`), obd: v(`${f.name}-700`) });
  const dark = (f) => ({ sbg: v(`${f.name}-950`), sfg: v(`${f.name}-300`), xbg: v(`${f.name}-400`), xfg: v(`${f.name}-950`), o: v(`${f.name}-300`), obd: v(`${f.name}-400`) });
  const both = (f) => { const l = light(f), d = dark(f); return Object.fromEntries(Object.keys(l).map((k) => [k, `light-dark(${l[k]}, ${d[k]})`])); };
  const tone = (name, fam) => `.dk-badge--tone-${name} { --dk-badge-sbg: var(--dk-bdg-${fam}-sbg); --dk-badge-sfg: var(--dk-bdg-${fam}-sfg); --dk-badge-xbg: var(--dk-bdg-${fam}-xbg); --dk-badge-xfg: var(--dk-bdg-${fam}-xfg); --dk-badge-ofg: var(--dk-bdg-${fam}-o); --dk-badge-obd: var(--dk-bdg-${fam}-obd); }`;
  return [
    `:root, [data-theme$="-light"] { --dk-bdg-xlayer: var(--black); ${set(light)} }`,
    `[data-theme$="-dark"] { --dk-bdg-xlayer: var(--white); ${set(dark)} }`,
    `:root:is([data-brand], [data-mode]):not([data-theme]), [data-mode]:not([data-theme]) { --dk-bdg-xlayer: light-dark(var(--black), var(--white)); ${set(both)} }`,
    ...Object.entries(STATUS).map(([name, fam]) => tone(name, fam)),
    ...fams.map((f) => tone(f.name, f.name)),
  ].join('\n');
}

// Badge.css with its palette rules made from tokens.json, or an error when it has no markers.
export function render(tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'))) {
  const text = fs.readFileSync(CSS, 'utf8');
  const a = text.indexOf('/* badge-palette:start'), b = text.indexOf(END);
  if (a < 0 || b < a) return { error: `${path.relative(ROOT, CSS)} has no badge-palette:start … ${END} markers` };
  return { text: text.slice(0, a) + START + '\n' + rules(tokens) + '\n' + text.slice(b), old: text };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = render();
  if (r.error) { console.error(r.error); process.exit(1); }
  if (r.text !== r.old) {
    if (process.argv.includes('--check')) { console.error(`${path.relative(ROOT, CSS)}: its palette tones are out of date: run npm run tokens`); process.exit(1); }
    fs.writeFileSync(CSS, r.text);
  }
}
