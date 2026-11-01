// Export tokens.json in the W3C Design Tokens format (DTCG 2025.10), for design tools and token pipelines.
//
//   node tools/tokens/export.mjs            write design-tokens/
//   node tools/tokens/export.mjs --check    exit 1 if design-tokens/ is out of date with tokens.json
//
// Writes
//   design-tokens/serupa.tokens.json            palette and every scale (the theme-independent tokens)
//   design-tokens/themes/<theme>.tokens.json  the alias colors for one theme, as references into the palette
//                                             ("{color.blue-600}"); layer one theme file over serupa.tokens.json
//   design-tokens/components/<name>.tokens.json  component tokens (Button's --button-*), referencing the tokens above
//   design-tokens/css-values.json             tokens the format has no type for yet (degrees, em, %, viewport
//                                             units, keywords, CSS shorthands), as plain CSS values
//
// Token paths are "<group>.<token name>", e.g. color.blue-600, spacing.spacing-4. The format doesn't allow "."
// in a name, so "spacing-0.5" becomes "spacing-0_5"; $extensions["com.serupa"].cssVar always gives the CSS variable.
import fs from 'node:fs';
import path from 'node:path';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const OUT = path.join(P, 'design-tokens');
const NS = 'com.serupa';
const BASE_FILE = 'serupa.tokens.json';

const round = (x, n) => Number(x.toFixed(n));
const first = (v) => (v && typeof v === 'object' ? Object.values(v)[0] : v);
const full = (re, s) => { const m = new RegExp('^(?:' + re.source + ')$', re.flags).exec(s); return m; };

function hexcolor(h) {
  h = h.replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const v = { colorSpace: 'srgb', components: rgb.map((c) => round(c / 255, 4)), hex: '#' + h.slice(0, 6).toLowerCase() };
  if (a !== 1) v.alpha = round(a, 3);
  return v;
}
function rgbfn(s) {   // rgb(0 0 0 / 0.05)
  const m = full(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)/, s.trim());
  const [r, g, b] = [1, 2, 3].map((i) => parseFloat(m[i]));
  const a = m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  const hx = (n) => Math.trunc(n).toString(16).padStart(2, '0');
  const v = { colorSpace: 'srgb', components: [r, g, b].map((c) => round(c / 255, 4)), hex: '#' + hx(r) + hx(g) + hx(b) };
  if (a !== 1) v.alpha = round(a, 3);
  return v;
}
const color = (s) => (s.trim().startsWith('#') ? hexcolor(s.trim()) : rgbfn(s.trim()));
function dim(s) {
  const m = full(/(-?\d*\.?\d+)(px|rem)/, String(s).trim());
  return m ? { value: parseFloat(m[1]), unit: m[2] } : null;
}
function shadow(s) {
  const layers = [];
  for (let part of s.split(/,(?![^()]*\))/)) {
    part = part.trim();
    const inset = part.startsWith('inset ');
    if (inset) part = part.slice(6);
    const cm = /(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})$/.exec(part);
    if (!cm) return null;
    let nums = part.slice(0, cm.index).split(/\s+/).filter(Boolean);
    if (nums.length < 2 || nums.length > 4) return null;
    nums = nums.map((n) => (/(px|rem)$/.test(n) ? n : n + 'px')).concat(Array(4 - nums.length).fill('0px'));
    const L = { color: color(cm[1]), offsetX: dim(nums[0]), offsetY: dim(nums[1]), blur: dim(nums[2]), spread: dim(nums[3]) };
    if (inset) L.inset = true;
    layers.push(L);
  }
  return layers.length === 1 ? layers[0] : layers;
}

/** [type, value] in the format, or null when it has no type for this value yet. */
export function typed(group, name, v) {
  v = String(v).trim();
  if (group === 'color') return /^(#|rgb)/.test(v) ? ['color', color(v)] : null;
  if (name.startsWith('text-shadow')) return null;   // CSS text-shadow has no spread; the format's shadow type always has one
  if (group === 'shadow' || name.startsWith('drop-shadow-')) {
    const s = v !== 'none' ? shadow(v) : null;
    return s ? ['shadow', s] : null;
  }
  if (group === 'transitions') {
    let m = full(/(\d+)ms/, v);
    if (m) return ['duration', { value: parseInt(m[1], 10), unit: 'ms' }];
    m = full(/cubic-bezier\(([^)]*)\)/, v);
    if (m) return ['cubicBezier', m[1].split(',').map(parseFloat)];
    if (v === 'linear') return ['cubicBezier', [0, 0, 1, 1]];
    return null;
  }
  if (full(/font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/, name) && /^\d+$/.test(v)) return ['fontWeight', parseInt(v, 10)];
  const d = dim(v);
  if (d) return ['dimension', d];
  if (full(/-?\d*\.?\d+/, v)) return ['number', parseFloat(v)];
  if (full(/-?\d*\.?\d+%/, v) && ['opacity', 'filters', 'transforms'].includes(group)) return ['number', round(parseFloat(v) / 100, 6)];   // opacity, brightness, scale… as ratios
  return null;
}

export const pathName = (n) => n.replace(/\./g, '_');
const ext = (name) => ({ [NS]: { cssVar: '--' + name } });
const setIn = (o, k) => (o[k] ||= {});

export function exportTokens(t, componentFiles) {
  const GROUPS = Object.fromEntries(Object.entries(t).filter(([, v]) => v && typeof v === 'object' && Array.isArray(v.tokens)));
  const ALIAS = GROUPS.color.tokens.filter((x) => x.value && typeof x.value === 'object' && Object.keys(x.value).length > 1);
  const THEMES = Object.keys(ALIAS[0].value);
  const base = {}, cssOnly = {};
  for (const [g, grp] of Object.entries(GROUPS)) {
    for (const x of grp.tokens) {
      if (g === 'color' && ALIAS.includes(x)) continue;
      const v = first(x.value);
      // A role that names another token of its group (motion-hover is {duration-150}) is exported as a reference to it.
      const to = full(/\{([^}]+)\}/, String(v)), target = to && grp.tokens.find((y) => y.name === to[1]);
      const tr = target && typed(g, target.name, first(target.value));
      const r = tr ? [tr[0], `{${g}.${pathName(target.name)}}`] : typed(g, x.name, v);
      if (!r) { setIn(cssOnly, g)[x.name] = { css: String(v), description: (x.usage || '').replace(/^Tailwind /, '') }; continue; }
      const tok = { $type: r[0], $value: r[1] };
      if (x.usage) tok.$description = x.usage;
      tok.$extensions = ext(x.name);
      setIn(base, g)[pathName(x.name)] = tok;
    }
  }
  // font families
  base.font = Object.fromEntries(Object.entries(t.type.families).map(([k, v]) => [k, {
    $type: 'fontFamily', $value: v.split(/,(?![^"]*")/).map((f) => f.trim().replace(/^["']+|["']+$/g, '')), $extensions: ext('font-' + k) }]));
  // type styles as typography composites
  for (const grp of t.type.groups) {
    for (const s of grp.styles) {
      const fs_ = dim(s.fontSize), lhd = dim(s.lineHeight);
      const ratio = lhd && lhd.unit === fs_.unit ? round(lhd.value / fs_.value, 4) : parseFloat(s.lineHeight);
      const fam = s.family || grp.family || 'sans';
      setIn(base, 'type')[pathName(s.name)] = {
        $type: 'typography',
        $value: { fontFamily: `{font.${fam}}`, fontSize: fs_, fontWeight: parseInt(s.fontWeight ?? 400, 10),
          letterSpacing: dim(String(s.letterSpacing ?? '0')) || { value: 0, unit: 'px' }, lineHeight: ratio },
        $description: s.usage || '', $extensions: { [NS]: { class: s.name } } };
    }
  }
  const ref = (v) => { const m = full(/\{(.+)\}/, v); return m ? `{color.${pathName(m[1])}}` : color(v); };
  const files = {
    [BASE_FILE]: base,
    'css-values.json': { $description: 'Tokens the W3C Design Tokens format (2025.10) has no type for yet: degrees, em, percentages of a box, viewport units, keywords, CSS shorthands, and text shadows (the shadow type in the format always has a spread, which CSS text-shadow does not allow). Use the CSS value as-is.', ...cssOnly },
  };
  for (const th of THEMES)
    files[`themes/${th}.tokens.json`] = { color: Object.fromEntries(ALIAS.map((x) => [pathName(x.name), { $type: 'color', $value: ref(x.value[th]), $description: x.usage || '', $extensions: ext(x.name) }])) };
  // component tokens (src/components/<Name>/<name>.tokens.json) are already in the format: published as they are
  for (const [name, data] of componentFiles) files['components/' + name] = data;
  return { files, counts: { typed: Object.values(base).reduce((n, v) => n + Object.keys(v).length, 0), aliases: ALIAS.length, themes: THEMES.length, css: Object.values(cssOnly).reduce((n, v) => n + Object.keys(v).length, 0) } };
}

export function componentTokenFiles(root = P) {
  const dir = path.join(root, 'src', 'components');
  return fs.readdirSync(dir).sort().flatMap((c) => fs.readdirSync(path.join(dir, c)).filter((f) => f.endsWith('.tokens.json')).sort()
    .map((f) => [f, JSON.parse(fs.readFileSync(path.join(dir, c, f), 'utf8'))]));
}

const dump = (d) => JSON.stringify(d, null, 2) + '\n';

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const { files, counts } = exportTokens(JSON.parse(fs.readFileSync(path.join(P, 'tokens.json'), 'utf8')), componentTokenFiles());
  if (process.argv.includes('--check')) {
    const stale = Object.entries(files).filter(([f, d]) => !fs.existsSync(path.join(OUT, f)) || fs.readFileSync(path.join(OUT, f), 'utf8') !== dump(d)).map(([f]) => f);
    if (stale.length) { console.log('design-tokens/ is out of date: run npm run tokens (' + stale.join(', ') + ')'); process.exit(1); }
    console.log('design-tokens/ matches tokens.json'); process.exit(0);
  }
  for (const [f, d] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true });
    fs.writeFileSync(path.join(OUT, f), dump(d));
  }
  console.log(`design-tokens/: ${counts.typed} typed tokens, ${counts.aliases} aliases × ${counts.themes} themes, ${counts.css} CSS-only values`);
}
