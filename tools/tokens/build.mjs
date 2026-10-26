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
//   .type-*                               one class per complete text style
//   @font-face                            the fonts in fonts/
// Everything but the @font-face rules sits in the dk.tokens cascade layer, the first of the system's layers.
import fs from 'node:fs';
import path from 'node:path';

const P = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..'));
const OUT = path.join(P, 'tokens.css');

export function buildTokensCss(t) {
  const themes = t.color.themes.map((x) => x.id);
  const themed = (x) => x.value && typeof x.value === 'object';
  const name = (n) => n.replace(/[\\.]/g, '\\$&');
  const ref = (v) => String(v).replace(/\{([^}]+)\}/g, (_, n) => `var(--${name(n)})`);
  const line = (n, v, usage) => `  --${name(n)}: ${ref(v)};${usage ? ` /* ${usage} */` : ''}\n`;
  const groups = Object.values(t).filter((g) => g && Array.isArray(g.tokens));
  const all = groups.flatMap((g) => g.tokens);

  let css = '/* Serupa — generated from tokens.json */\n';
  css += '@layer dk.tokens, dk.base, dk.components, dk.utilities;\n@layer dk.tokens {\n';
  css += `:root, [data-theme="${themes[0]}"] {\n`;
  for (const x of all.filter(themed)) css += line(x.name, x.value[themes[0]], x.usage);
  css += '}\n';
  for (const th of themes.slice(1)) {
    css += `[data-theme="${th}"] {\n`;
    for (const x of all.filter((x) => themed(x) && Object.keys(x.value).length > 1 && x.value[th] != null)) css += line(x.name, x.value[th]);
    css += '}\n';
  }

  css += axes(t, all.filter((x) => themed(x) && new Set(Object.values(x.value)).size > 1), line);

  const styles = t.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: s.family || g.family })));
  css += ':root {\n';
  for (const x of all.filter((x) => !themed(x))) css += line(x.name, x.value, x.usage);
  for (const [k, v] of Object.entries(t.type.families)) css += `  --font-${k}: ${v};\n`;
  for (const s of styles) css += line(`text-${s.name}`, `${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${s.family})`, s.usage);
  css += '}\n';
  css += contrastAndDensity(all, line);   // after :root, so data-density on the root wins over it
  for (const s of styles) {
    css += `.${s.name} {\n  font-family: var(--font-${s.family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n  letter-spacing: ${s.letterSpacing};\n`;
    if (s.fontStyle && s.fontStyle !== 'normal') css += `  font-style: ${s.fontStyle};\n`;
    if (s.textTransform) css += `  text-transform: ${s.textTransform};\n`;
    if (s.opticalSize != null) css += `  font-variation-settings: "opsz" ${s.opticalSize};\n`;
    css += '}\n';
  }
  // While theme.js switches the theme (data-theme-switching, for two frames), nothing transitions: every color changes
  // at once, as the page surface does, instead of controls fading one by one. !important in the first layer beats all.
  css += ':where([data-theme-switching]), :where([data-theme-switching]) *, :where([data-theme-switching]) *::before, :where([data-theme-switching]) *::after {\n  transition: none !important;\n}\n';
  css += '}\n';
  for (const f of t.type.fonts || [])
    css += `@font-face {\n  font-family: "${f.family}";\n  src: url("${f.file}") format("woff2");\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  font-display: swap;\n}\n`;
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
  const more = all.filter((x) => x.contrastMore);
  const pairs = more.map((x) => line(x.name, typeof x.contrastMore === 'string' ? x.contrastMore : `light-dark(${x.contrastMore.light}, ${x.contrastMore.dark})`)).join('');
  let css = `[data-theme$="-light"] { color-scheme: light; }\n[data-theme$="-dark"] { color-scheme: dark; }\n`;
  // Also on nested data-mode elements, which redeclare the normal colors.
  css += `[data-contrast="more"], [data-contrast="more"] [data-mode] {\n${pairs}}\n`;
  css += `@media (prefers-contrast: more) {\n:root:not([data-contrast="normal"]), :root:not([data-contrast="normal"]) [data-mode]:not([data-contrast="normal"] *) {\n${pairs}}\n}\n`;
  const compact = all.filter((x) => x.compact != null);
  css += `[data-density="compact"] {\n${compact.map((x) => line(x.name, x.compact)).join('')}}\n`;
  css += `[data-density="comfortable"] {\n${compact.map((x) => line(x.name, x.value)).join('')}}\n`;
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
