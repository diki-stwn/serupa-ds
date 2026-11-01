// The token source, tokens/serupa.tokens.json, in the W3C Design Tokens format (DTCG 2025.10), and tokens.json made
// from it. npm run tokens runs this first; tokens.css, design-tokens/ and the README tables are made from tokens.json.
//
//   node tools/tokens/source.mjs            write tokens.json from tokens/serupa.tokens.json
//   node tools/tokens/source.mjs --check    exit 1 if tokens.json isn't what the source gives, or the source is wrong
//
// The source holds every group of tokens.json as a DTCG group, in the same order, each token as a DTCG token:
//   "spacing-0_5": { "$type": "dimension", "$value": { "value": 0.125, "unit": "rem" }, "$description": "…" }
// A token's CSS value is printed from $value ("0.125rem"). Serupa's own facts sit in $extensions["com.serupa"]:
//   name          the token's name, when it isn't the key ("spacing-0.5": the format doesn't allow a dot)
//   css           the CSS value as written, when it isn't how $value prints ("5%" for the number 0.05, ".75rem",
//                 a shadow written with rgb()). The check makes sure it still means $value: change both, or take
//                 css out to have $value printed
//   themes        a value per theme for the other themes (an alias color); $value is the first theme's
//   themed        a value that is set with the themed tokens though it's the same in every theme (the palette)
//   contrastMore, compact   the value with more contrast, and in the compact density, as in tokens.json
// A token the format has no type for yet (degrees, em, keywords, CSS shorthands) has no $type and its CSS as $value.
// The type styles, font files and families aren't tokens: they're kept as they are, in the root's $extensions.
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { typed, pathName } from './export.mjs';

const P = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..'));
export const SOURCE = path.join(P, 'tokens', 'serupa.tokens.json');
const OUT = path.join(P, 'tokens.json');
const NS = 'com.serupa';
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const REF = /^\{([^{}]+)\}$/;

const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
const PRINT = {
  color: (v) => (v.alpha != null ? v.hex + hex2(v.alpha) : v.hex),
  dimension: (v) => v.value + v.unit,
  duration: (v) => v.value + v.unit,
  number: (v) => String(v),
  fontWeight: (v) => String(v),
  cubicBezier: (v) => `cubic-bezier(${v.join(', ')})`,
  shadow: (v) => [].concat(v).map((L) => [L.inset ? 'inset' : '', ...['offsetX', 'offsetY', 'blur', 'spread'].map((k) => PRINT.dimension(L[k])), PRINT.color(L.color)].filter(Boolean).join(' ')).join(', '),
};

/** tokens.json → the source. Used once to make tokens/serupa.tokens.json; the round trip test runs it too. */
export function toSource(t) {
  const groups = Object.entries(t).filter(([, v]) => isObj(v) && Array.isArray(v.tokens));
  const first = t.color.themes[0].id;
  const where = new Map();
  for (const [g, grp] of groups) for (const x of grp.tokens) {
    if (where.has(x.name)) throw new Error(`two tokens are named ${x.name}`);
    where.set(x.name, [g, pathName(x.name), x]);
  }
  const typeOf = (g, x, v) => {
    const m = REF.exec(v);
    if (m && where.has(m[1])) { const [g2, , y] = where.get(m[1]); return typeOf(g2, y, String(Object.values(isObj(y.value) ? y.value : { v: y.value })[0])); }
    return typed(g, x.name, v);
  };
  const src = { $description: t.meta.source, $extensions: { [NS]: { version: t.version, name: t.name, themes: t.color.themes, type: t.type } } };
  for (const [g, grp] of groups) {
    const out = /** @type {Record<string, any>} */ (src[g] = {});
    if (grp.note != null) out.$description = grp.note;
    for (const x of grp.tokens) {
      const ext = {};
      if (pathName(x.name) !== x.name) ext.name = x.name;
      let v = x.value;
      if (isObj(v)) {
        const keys = Object.keys(v);
        if (keys[0] !== first) throw new Error(`${x.name}: the first theme's value comes first`);
        if (keys.length === 1) ext.themed = true;
        else ext.themes = Object.fromEntries(keys.slice(1).map((k) => [k, v[k]]));
        v = v[first];
      }
      v = String(v);
      const tok = {};
      const m = REF.exec(v), r = typeOf(g, x, v);
      if (m && where.has(m[1])) {
        const [g2, p2] = where.get(m[1]);
        if (r) tok.$type = r[0];
        tok.$value = `{${g2}.${p2}}`;
      } else if (r) {
        tok.$type = r[0]; tok.$value = r[1];
        if (PRINT[r[0]](r[1]) !== v) ext.css = v;
      } else tok.$value = v;
      if ('usage' in x) tok.$description = x.usage;
      for (const k of Object.keys(x)) if (!['name', 'value', 'usage'].includes(k)) ext[k] = x[k];
      if (Object.keys(ext).length) tok.$extensions = { [NS]: ext };
      out[pathName(x.name)] = tok;
    }
  }
  return src;
}

/** The source → tokens.json, and what's wrong with the source (a css that no longer means its $value, a broken reference). */
export function fromSource(src) {
  const meta = src.$extensions[NS];
  const problems = [];
  const groups = Object.entries(src).filter(([k, v]) => !k.startsWith('$') && isObj(v));
  const names = new Map();
  for (const [g, grp] of groups) for (const [p, tok] of Object.entries(grp)) if (!p.startsWith('$')) names.set(`${g}.${p}`, tok.$extensions?.[NS]?.name ?? p);
  const first = meta.themes[0].id;
  const t = { version: meta.version };
  const group = (g, grp) => {
    const tokens = [];
    for (const [p, tok] of Object.entries(grp)) {
      if (p.startsWith('$')) continue;
      const ext = tok.$extensions?.[NS] || {};
      const name = ext.name ?? p;
      let css;
      const m = typeof tok.$value === 'string' ? REF.exec(tok.$value) : null;
      if (m) {
        if (!names.has(m[1])) problems.push(`${g}.${p}: {${m[1]}} isn't a token`);
        css = `{${names.get(m[1])}}`;
      } else if (tok.$type) {
        if (!PRINT[tok.$type]) { problems.push(`${g}.${p}: no CSS for the type ${tok.$type}`); continue; }
        css = ext.css ?? PRINT[tok.$type](tok.$value);
        if (ext.css != null) {
          const back = typed(g, name, ext.css);
          if (!back || back[0] !== tok.$type || !isDeepStrictEqual(back[1], tok.$value)) problems.push(`${g}.${p}: its css "${ext.css}" no longer means its $value; change both, or take css out`);
        }
      } else css = String(tok.$value);
      const value = ext.themes ? { [first]: css, ...ext.themes } : ext.themed ? { [first]: css } : css;
      const x = { name, value };
      if ('$description' in tok) x.usage = tok.$description;
      for (const [k, v] of Object.entries(ext)) if (!['name', 'css', 'themes', 'themed'].includes(k)) x[k] = v;
      tokens.push(x);
    }
    return tokens;
  };
  for (const [g, grp] of groups) {
    t[g] = g === 'color' ? { themes: meta.themes, tokens: group(g, grp) } : { ...(grp.$description != null ? { note: grp.$description } : {}), tokens: group(g, grp) };
    if (g === 'color') t.type = meta.type;
  }
  t.name = meta.name;
  t.meta = { source: src.$description };
  return { tokens: t, problems };
}

const dump = (d) => JSON.stringify(d, null, 2) + '\n';

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  if (process.argv.includes('--init')) {   // once: make the source from tokens.json
    fs.mkdirSync(path.dirname(SOURCE), { recursive: true });
    fs.writeFileSync(SOURCE, dump(toSource(JSON.parse(fs.readFileSync(OUT, 'utf8')))));
    console.log('wrote tokens/serupa.tokens.json');
    process.exit(0);
  }
  const { tokens, problems } = fromSource(JSON.parse(fs.readFileSync(SOURCE, 'utf8')));
  if (problems.length) { console.log('tokens/serupa.tokens.json:\n  ' + problems.join('\n  ')); process.exit(1); }
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== dump(tokens)) { console.log('tokens.json is out of date with tokens/serupa.tokens.json: run npm run tokens'); process.exit(1); }
    console.log('tokens.json matches tokens/serupa.tokens.json'); process.exit(0);
  }
  fs.writeFileSync(OUT, dump(tokens));
  console.log('tokens.json: written from tokens/serupa.tokens.json');
}
