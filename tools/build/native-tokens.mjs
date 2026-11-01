// Tokens for native apps (138): the colors, spacing, radii, border widths, sizes, font sizes, opacities and durations
// of design-tokens/, as Swift, Kotlin and Android resources. npm run build writes them into dist/native/:
//   ios/SerupaTokens.swift                  SwiftUI: SerupaTokens (sizes in points, durations in seconds),
//                                           SerupaPalette (every palette color) and SerupaColors (the alias colors,
//                                           one value per theme: SerupaColors.blueLight.primary)
//   android/SerupaTokens.kt                 Jetpack Compose: the same three, in dp, sp and milliseconds
//                                           (SerupaColors.BlueLight.primary)
//   android/res/values/serupa_tokens.xml    the palette, the sizes (dp, font sizes sp), durations (integers, ms) and
//                                           opacities (float dimens)
//   android/res-<brand>/values/serupa_colors.xml, values-night/   the alias colors of a brand, light and dark: add
//                                           the brand's folder as a resource directory, and night mode picks the dark
// A rem is 16 points (dp). Shadows, easings, type styles and values the format has no type for aren't included.
import fs from 'node:fs';
import path from 'node:path';

const NS = 'com.serupa';
const GROUPS = { spacing: 'size', radius: 'size', borders: 'size', sizing: 'size', fontSize: 'font', opacity: 'ratio', transitions: 'time' };

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
function* walk(tree, p = []) {
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$') || !isObj(v)) continue;
    if ('$value' in v) yield [[...p, k], v];
    else yield* walk(v, [...p, k]);
  }
}
const cssName = (tok, p) => (tok.$extensions?.[NS]?.cssVar || '--' + p.join('-')).slice(2);
/** blue-600 → blue600, spacing-0.5 → spacing0_5, rounded-2xl → rounded2xl */
export const camel = (n) => n.replace(/\./g, '_').replace(/-+([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascal = (n) => camel(n).replace(/^./, (c) => c.toUpperCase());
const snake = (n) => 'serupa_' + n.replace(/[.-]+/g, '_');
const num = (n) => String(Number(n.toFixed(4)));
const doc = (s) => (s ? String(s).replace(/\s+/g, ' ').replace(/\*\//g, '* /').trim() : '');

/** Every token the native files carry, resolved: { name, kind, value, description } (kind: color, size, font, ratio, time). */
export function nativeTokens(dir) {
  const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const base = load('serupa.tokens.json');
  const themes = Object.fromEntries(fs.readdirSync(path.join(dir, 'themes')).sort().map((f) => [f.replace('.tokens.json', ''), load(path.join('themes', f))]));
  const index = new Map([...walk(base)].map(([p, t]) => [p.join('.'), t]));
  const resolve = (v, more = new Map()) => {
    for (let i = 0; typeof v === 'string' && /^\{.+\}$/.test(v) && i < 10; i++) { const k = v.slice(1, -1); v = (more.get(k) || index.get(k))?.$value; }
    return v;
  };
  const value = (tok, more) => {
    const v = resolve(tok.$value, more);
    if (tok.$type === 'color' && isObj(v)) return { r: v.components[0], g: v.components[1], b: v.components[2], a: v.alpha ?? 1, hex: v.hex };
    if (tok.$type === 'dimension' && isObj(v)) return v.unit === 'rem' ? v.value * 16 : v.value;
    if (tok.$type === 'duration' && isObj(v)) return v.unit === 's' ? v.value * 1000 : v.value;
    if (tok.$type === 'number' && typeof v === 'number') return v;
    return null;
  };
  const palette = [], scalar = [];
  for (const [p, tok] of walk(base)) {
    if (p[0] === 'color' && tok.$type === 'color') {
      const v = value(tok);
      if (v) palette.push({ name: cssName(tok, p), kind: 'color', value: v, description: doc(tok.$description) });
      continue;
    }
    const kind = GROUPS[p[0]];
    if (!kind) continue;
    const want = { size: 'dimension', font: 'dimension', ratio: 'number', time: 'duration' }[kind];
    if (tok.$type !== want) continue;
    const v = value(tok);
    if (v != null) scalar.push({ name: cssName(tok, p), kind, value: v, description: doc(tok.$description) });
  }
  const aliases = {};
  for (const [th, tree] of Object.entries(themes)) {
    const own = new Map([...walk(tree)].map(([p, t]) => [p.join('.'), t]));
    aliases[th] = [...walk(tree)].map(([p, tok]) => ({ name: cssName(tok, p), kind: 'color', value: value(tok, own), description: doc(tok.$description) })).filter((x) => x.value);
  }
  return { palette, scalar, aliases };
}

const hex8 = (c) => {
  const a = Math.round(c.a * 255).toString(16).padStart(2, '0');
  return (a + c.hex.slice(1)).toUpperCase();
};
const swiftColor = (c) => `Color(.sRGB, red: ${num(c.r)}, green: ${num(c.g)}, blue: ${num(c.b)}, opacity: ${num(c.a)})`;
const swiftValue = (x) => (x.kind === 'time' ? `TimeInterval = ${num(x.value / 1000)}` : x.kind === 'ratio' ? `Double = ${num(x.value)}` : `CGFloat = ${num(x.value)}`);
const ktValue = (x) => (x.kind === 'time' ? `${Math.round(x.value)}L` : x.kind === 'ratio' ? `${num(x.value)}f` : `${num(x.value)}.${x.kind === 'font' ? 'sp' : 'dp'}`);
const line = (indent, x, body) => `${x.description ? `${indent}/** ${x.description} */\n` : ''}${indent}${body}\n`;

/** The files of dist/native/, by their path in it. */
export function nativeFiles(dir, version) {
  const { palette, scalar, aliases } = nativeTokens(dir);
  const themes = Object.keys(aliases);
  const head = (c) => `${c} Serupa ${version}: design tokens for native apps, generated from design-tokens/ (tools/build/native-tokens.mjs). Don't edit.\n`;
  const names = aliases[themes[0]].map((x) => x.name);
  const files = {};

  let swift = head('//') + '\nimport SwiftUI\n\n/// Sizes in points (a rem is 16), durations in seconds, opacities from 0 to 1.\npublic enum SerupaTokens {\n';
  for (const x of scalar) swift += line('    ', x, `public static let ${camel(x.name)}: ${swiftValue(x)}`);
  swift += '}\n\n/// Every color of the palette, the same in every theme.\npublic enum SerupaPalette {\n';
  for (const x of palette) swift += line('    ', x, `public static let ${camel(x.name)} = ${swiftColor(x.value)}`);
  swift += `}\n\n/// The alias colors, one set per theme: SerupaColors.${camel(themes[0])}.primary.\npublic struct SerupaColors {\n`;
  for (const x of aliases[themes[0]]) swift += line('    ', x, `public let ${camel(x.name)}: Color`);
  for (const th of themes) {
    swift += `\n    public static let ${camel(th)} = SerupaColors(\n`;
    swift += aliases[th].map((x) => `        ${camel(x.name)}: ${swiftColor(x.value)}`).join(',\n') + '\n    )\n';
  }
  files['ios/SerupaTokens.swift'] = swift + '}\n';

  let kt = head('//') + '\npackage com.serupa.tokens\n\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.unit.dp\nimport androidx.compose.ui.unit.sp\n\n';
  kt += '/** Sizes in dp (a rem is 16), font sizes in sp, durations in milliseconds, opacities from 0 to 1. */\nobject SerupaTokens {\n';
  for (const x of scalar) kt += line('    ', x, `${x.kind === 'time' || x.kind === 'ratio' ? 'const val' : 'val'} ${camel(x.name)} = ${ktValue(x)}`);
  kt += '}\n\n/** Every color of the palette, the same in every theme. */\nobject SerupaPalette {\n';
  for (const x of palette) kt += line('    ', x, `val ${camel(x.name)} = Color(0x${hex8(x.value)})`);
  kt += `}\n\n/** The alias colors, one set per theme: SerupaColors.${pascal(themes[0])}.primary. */\ndata class SerupaColors(\n`;
  kt += aliases[themes[0]].map((x) => line('    ', x, `val ${camel(x.name)}: Color,`)).join('') + ') {\n    companion object {\n';
  for (const th of themes) {
    kt += `        val ${pascal(th)} = SerupaColors(\n`;
    kt += aliases[th].map((x) => `            ${camel(x.name)} = Color(0x${hex8(x.value)}),`).join('\n') + '\n        )\n';
  }
  files['android/SerupaTokens.kt'] = kt + '    }\n}\n';

  const xml = (body) => `<?xml version="1.0" encoding="utf-8"?>\n${head('<!--').replace(/\n$/, ' -->\n')}<resources>\n${body}</resources>\n`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/--/g, '- -');
  const xcolor = (x) => `    <color name="${snake(x.name)}">#${hex8(x.value)}</color>${x.description ? ` <!-- ${esc(x.description)} -->` : ''}\n`;
  let res = '';
  for (const x of palette) res += xcolor(x);
  for (const x of scalar) {
    const c = x.description ? ` <!-- ${esc(x.description)} -->` : '';
    if (x.kind === 'size' || x.kind === 'font') res += `    <dimen name="${snake(x.name)}">${num(x.value)}${x.kind === 'font' ? 'sp' : 'dp'}</dimen>${c}\n`;
    else if (x.kind === 'time') res += `    <integer name="${snake(x.name)}">${Math.round(x.value)}</integer>${c}\n`;
    else res += `    <item name="${snake(x.name)}" format="float" type="dimen">${num(x.value)}</item>${c}\n`;
  }
  files['android/res/values/serupa_tokens.xml'] = xml(res);
  for (const th of themes) {
    const [brand, mode] = th.split('-');
    if (aliases[th].map((x) => x.name).join() !== names.join()) throw new Error(`${th} has other alias colors than ${themes[0]}`);
    files[`android/res-${brand}/values${mode === 'dark' ? '-night' : ''}/serupa_colors.xml`] = xml(aliases[th].map(xcolor).join(''));
  }
  return files;
}
