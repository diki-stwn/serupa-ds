// npm run tokens: tokens.json → tokens.css. The design system page used to write tokens.css; this
// writes the same file from the repo, so a token change no longer needs the (frozen) page. npm run build
// runs it first. --check exits 1 if tokens.css isn't what tokens.json gives (CI and the tests use it).
//   node tools/tokens/build.mjs [--check] [project dir]
//
// tokens.css, in order:
//   :root, [data-theme="<first theme>"]   every themed token (the colors and the shadows) at its first theme's value
//   [data-theme="<theme>"]                each other theme: the tokens with a value per theme (the alias colors)
//   theme axes (ADR-0011)                 data-brand / data-mode on an element without data-theme: the colors that
//                                         differ between themes as light-dark() pairs, so the operating system's
//                                         light or dark setting applies from the first paint, with no JavaScript
//   :root                                 every other token, the font families, and the type-* shorthands
//   contrast and density axes             data-contrast="more" (and prefers-contrast: more) and data-density="compact"
//   shadow axis (73)                      data-shadow="brand": the box shadows in a deep shade of the brand color
//   :lang() per script (143)              taller lines for Arabic, Devanagari, Thai and CJK; CJK's font by language
//   .type-*                               one class per complete text style
//   @font-face                            the fonts in fonts/
// Everything but the @font-face rules sits in the dk.tokens cascade layer, the first of the system's layers.
import fs from 'node:fs';
import path from 'node:path';

const P = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..'));
const OUT = path.join(P, 'tokens.css');
// A contrastMore keyed by theme id ({ "blue-light": …, "violet-dark": … }) rather than { light, dark }.
const perTheme = (x) => !!x.contrastMore && typeof x.contrastMore === 'object' && !('light' in x.contrastMore);

/** Each token's description from tokens.json, by its property name (--primary → "Main action color…"). */
export function tokenDescriptions(t) {
  const out = new Map();
  for (const g of Object.values(t)) if (g && Array.isArray(g.tokens)) for (const x of g.tokens) if (x.usage) out.set(`--${x.name}`, x.usage);
  return out;
}

export function buildTokensCss(t) {
  const themes = t.color.themes.map((x) => x.id);
  const themed = (x) => x.value && typeof x.value === 'object';
  const name = (n) => n.replace(/[\\.]/g, '\\$&');
  const ref = (v) => String(v).replace(/\{([^}]+)\}/g, (_, n) => `var(--${name(n)})`);
  // No comments: tokens.css is the first stylesheet a page waits for, and the descriptions were over half of it. They
  // stay in tokens.json (tokenDescriptions below), design-tokens/ and the editor data.
  const line = (n, v) => `  --${name(n)}: ${ref(v)};\n`;
  const groups = Object.values(t).filter((g) => g && Array.isArray(g.tokens));
  const tokens = groups.flatMap((g) => g.tokens);
  // A contrastMore with a value per theme (a brand color: violet's is violet) can't be one light-dark() pair, so it
  // becomes an internal themed token, --dk-more-<name>, that every theme and brand rule below sets like any alias;
  // the contrast rule then points the token at it (contrastAndDensity).
  const all = [...tokens, ...tokens.filter(perTheme).map((x) => ({ name: `dk-more-${x.name}`, value: x.contrastMore }))];

  let css = '/* Serupa — generated from tokens.json */\n';
  css += '@layer dk.tokens, dk.base, dk.components, dk.utilities;\n@layer dk.tokens {\n';
  css += `:root, [data-theme="${themes[0]}"] {\n`;
  for (const x of all.filter(themed)) css += line(x.name, x.value[themes[0]]);
  css += '}\n';
  for (const th of themes.slice(1)) {
    css += `[data-theme="${th}"] {\n`;
    for (const x of all.filter((x) => themed(x) && Object.keys(x.value).length > 1 && x.value[th] != null)) css += line(x.name, x.value[th]);
    css += '}\n';
  }

  css += axes(t, all.filter((x) => themed(x) && new Set(Object.values(x.value)).size > 1), line);

  const styles = t.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: s.family || g.family })));
  css += ':root {\n';
  for (const x of all.filter((x) => !themed(x))) css += line(x.name, x.value);
  for (const [k, v] of Object.entries(t.type.families)) css += `  --font-${k}: ${v};\n`;
  for (const s of styles) css += line(`text-${s.name}`, `${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${s.family})`);
  css += '}\n';
  css += contrastAndDensity(all, line);   // after :root, so data-density on the root wins over it
  css += tintedShadows(all, line);
  css += scripts(t, all);
  for (const s of styles) {
    css += `.${s.name} {\n  font-family: var(--font-${s.family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n  letter-spacing: ${s.letterSpacing};\n`;
    if (s.fontStyle && s.fontStyle !== 'normal') css += `  font-style: ${s.fontStyle};\n`;
    if (s.textTransform) css += `  text-transform: ${s.textTransform};\n`;
    if (s.opticalSize != null) css += `  font-variation-settings: "opsz" ${s.opticalSize};\n`;
    css += '}\n';
  }
  css += '}\n';
  for (const f of t.type.fonts || [])
    css += `@font-face {\n  font-family: "${f.family}";\n  src: url("${f.file}") format("woff2");\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  font-display: swap;\n${f.unicodeRange ? `  unicode-range: ${f.unicodeRange};\n` : ''}}\n`;
  // "Inter Fallback" (144, tools/fonts/fallback.mjs): a font already on the device, sized like Inter, drawn until Inter
  // arrives, so the text doesn't move when it swaps in.
  for (const f of t.type.fallbacks || [])
    css += `@font-face {\n  font-family: "${f.family}";\n  src: ${f.local.map((n) => `local("${n}")`).join(', ')};\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  size-adjust: ${f.sizeAdjust};\n  ascent-override: ${f.ascentOverride};\n  descent-override: ${f.descentOverride};\n  line-gap-override: ${f.lineGapOverride};\n  unicode-range: ${f.unicodeRange};\n}\n`;
  return css;
}

// Fonts and line heights by script (143, tokens.json's type.scripts). The sans stack names Noto Sans Arabic, Hebrew,
// Devanagari and Thai after Inter: each draws only its own script, so the browser picks the right one per character,
// whatever the lang. Han characters are drawn differently in Japanese, Korean and Chinese, so the CJK font follows lang.
// Marks above and below the letters need more room than Latin: under those langs every text-*--line-height is at least
// the script's ratio of the font size (in em, so it holds at the size the component draws). :where() keeps it at no
// specificity, so a component's or a page's own line height still wins; and it matches every element in that lang, so
// a lang="th" section inside an English page gets it too.
function scripts(t, all) {
  const list = t.type.scripts || [];
  const heights = all.filter((x) => /^text-[a-z0-9]+--line-height$/.test(x.name));
  const sel = (langs) => `:where(${langs.map((l) => `:lang(${l})`).join(', ')})`;
  let css = '';
  for (const ratio of [...new Set(list.map((s) => s.lineHeight).filter(Boolean))]) {
    css += `${sel(list.filter((s) => s.lineHeight === ratio).flatMap((s) => s.lang))} {\n`;
    for (const x of heights) css += `  --${x.name}: max(${/^[\d.]+$/.test(x.value) ? x.value + 'em' : x.value}, ${ratio}em);\n`;
    css += '}\n';
  }
  const sans = t.type.families.sans;
  for (const s of list.filter((s) => s.families))
    css += `${sel(s.lang)} {\n  --font-sans: ${sans.replace('"Inter Fallback", ', `"Inter Fallback", ${s.families.map((f) => `"${f}"`).join(', ')}, `)};\n}\n`;
  return css;
}

// Theme axes (ADR-0011). Themes are "<brand>-<mode>" ids; data-brand and data-mode pick them separately. Each color
// that differs between themes is written once per brand as light-dark(light, dark), and the element's color-scheme
// (set by data-mode, "light dark" for auto) chooses, wherever the color is used: so a data-mode="dark" section works
// inside a light page. An element with data-theme keeps the flat theme above (theme.js sets it), so nothing changes
// for pages that use it. The root without either attribute stays light, as before.
function axes(t, varying, line) {
  const themes = t.color.themes.map((x) => x.id);
  const brands = [...new Set(themes.map((id) => id.split('-')[0]))];
  const pair = (x, b) => `light-dark(${x.value[b + '-light']}, ${x.value[b + '-dark']})`;
  const byBrand = varying.filter((x) => new Set(brands.map((b) => pair(x, b))).size > 1);
  // The full set goes on the root when it has an axis, and on any nested data-mode element, so a dark section works
  // inside a page with no axes or with data-theme (whose flat values can't flip). :where() keeps it at one
  // attribute's weight: it still beats :root (it comes later), and data-contrast beats it.
  let css = `:where(:root:is([data-brand], [data-mode]), [data-mode]):not([data-theme]) {
  color-scheme: light dark;
`;
  for (const x of varying) css += line(x.name, pair(x, brands[0]));
  css += '}\n';
  for (const b of brands) {
    css += `:root[data-brand="${b}"]:not([data-theme]), [data-brand="${b}"]:not([data-theme]) {\n`;
    for (const x of byBrand) css += line(x.name, pair(x, b));
    css += '}\n';
  }
  // A nested data-mode element keeps the brand of the page or section around it.
  for (const b of brands) {
    css += `:is([data-theme^="${b}-"], [data-brand="${b}"]) [data-mode]:not([data-theme], [data-brand]) {\n`;
    for (const x of byBrand) css += line(x.name, pair(x, b));
    css += '}\n';
  }
  css += `:root[data-mode="auto"]:not([data-theme]), [data-mode="auto"]:not([data-theme]) { color-scheme: light dark; }\n`;
  css += `:root[data-mode="light"]:not([data-theme]), [data-mode="light"]:not([data-theme]) { color-scheme: light; }\n`;
  css += `:root[data-mode="dark"]:not([data-theme]), [data-mode="dark"]:not([data-theme]) { color-scheme: dark; }\n`;
  return css;
}

// Contrast and density (ADR-0011). A color token's contrastMore { light, dark } is its stronger pair (a size token's
// is one value, like a thicker focus ring), used for data-contrast="more" and, unless the page says data-contrast="normal", when the system asks for more contrast.
// The pairs are light-dark(), so data-theme sets color-scheme here too, not only in base.css. A token's compact
// value is its size under data-density="compact"; data-density="comfortable" puts the defaults back in a section.
function contrastAndDensity(all, line) {
  const more = all.filter((x) => x.contrastMore && !perTheme(x));
  const pairs = more.map((x) => line(x.name, typeof x.contrastMore === 'string' ? x.contrastMore : `light-dark(${x.contrastMore.light}, ${x.contrastMore.dark})`)).join('');
  // A per-theme one reads its --dk-more-* token, set by whichever theme or brand rule applies to the element. The
  // brand rules that set the normal value weigh up to three attributes (:root[data-brand]:not([data-theme])), so
  // these carry :not(#dk-more), which matches every element and outweighs them: asking for more contrast beats the
  // brand. They also go on nested data-brand and data-theme sections, which redeclare the brand's colors.
  const brand = all.filter(perTheme).map((x) => `  --${x.name}: var(--dk-more-${x.name});\n`).join('');
  const nested = ':is([data-mode], [data-brand], [data-theme])';
  let css = `[data-theme$="-light"] { color-scheme: light; }\n[data-theme$="-dark"] { color-scheme: dark; }\n`;
  // Also on nested data-mode elements, which redeclare the normal colors.
  css += `[data-contrast="more"], [data-contrast="more"] [data-mode] {\n${pairs}}\n`;
  if (brand) css += `[data-contrast="more"]:not(#dk-more), [data-contrast="more"] ${nested}:not(#dk-more) {\n${brand}}\n`;
  css += `@media (prefers-contrast: more) {\n:root:not([data-contrast="normal"]), :root:not([data-contrast="normal"]) [data-mode]:not([data-contrast="normal"] *) {\n${pairs}}\n`;
  if (brand) css += `:root:not([data-contrast="normal"]):not(#dk-more), :root:not([data-contrast="normal"]) ${nested}:not([data-contrast="normal"], [data-contrast="normal"] *, #dk-more) {\n${brand}}\n`;
  css += '}\n';
  const compact = all.filter((x) => x.compact != null);
  css += `[data-density="compact"] {\n${compact.map((x) => line(x.name, x.compact)).join('')}}\n`;
  css += `[data-density="comfortable"] {\n${compact.map((x) => line(x.name, x.value)).join('')}}\n`;
  return css;
}

// Shadows tinted with the brand (73): data-shadow="brand" swaps each box shadow's black for a deep shade of the
// brand color (its red, green and blue at 30%), at the same opacity, so a raised card or a menu reads as part of
// the brand rather than grey. data-shadow="neutral" puts the black back in a section. The shade is worked out where
// the attribute is, from that element's --primary.
const TINT = 'rgb(from var(--primary) calc(r * 0.3) calc(g * 0.3) calc(b * 0.3) / $1)';
function tintedShadows(all, line) {
  const box = all.filter((x) => /^shadow-(2xs|xs|sm|md|lg|xl|2xl)$/.test(x.name));
  const at = (x) => (typeof x.value === 'object' ? Object.values(x.value)[0] : x.value);
  let css = `[data-shadow="brand"] {\n${box.map((x) => line(x.name, at(x).replace(/rgb\(0 0 0 \/ ([\d.]+)\)/g, TINT))).join('')}}\n`;
  css += `[data-shadow="neutral"] {\n${box.map((x) => line(x.name, at(x))).join('')}}\n`;
  return css;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const css = buildTokensCss(JSON.parse(fs.readFileSync(path.join(P, 'tokens.json'), 'utf8')));
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (process.argv.includes('--check')) {
    if (now === css) { console.log('tokens.css is up to date with tokens.json'); process.exit(0); }
    console.error('tokens.css is out of date with tokens.json: run npm run tokens and commit it'); process.exit(1);
  }
  if (now !== css) fs.writeFileSync(OUT, css);
  console.log(now === css ? 'tokens.css unchanged' : 'Wrote tokens.css');
}
