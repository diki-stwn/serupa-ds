// Figma variables from design-tokens/ (27): the tokens as variables in a Figma file, through Figma's REST API, so a
// design file uses the same values as the code. The Figma variables workflow runs it on main when the tokens change;
// it needs a Figma plan with the Variables REST API (Enterprise) and two repository secrets, FIGMA_TOKEN (a personal
// access token with the file_variables:read and file_variables:write scopes) and FIGMA_FILE (the file's key).
//
//   node tools/tokens/figma-variables.mjs            show what it would send (no token needed)
//   node tools/tokens/figma-variables.mjs --send     read the file's variables, then create or update ours
//
// Three collections:
//   Serupa palette   every palette color, one mode
//   Serupa themes    the alias colors, one mode per theme (Blue Light…), each an alias of a palette variable
//   Serupa scales    spacing, radii, border widths, sizes, font sizes and durations (numbers: px, ms), opacities (0–1)
// A variable is named by its path ("spacing/spacing-4"), carries its description, and its code syntax is the CSS
// variable (var(--spacing-4)), so Dev Mode shows the name to write. It only creates and updates: a variable or mode
// that's in the file but no longer in the tokens is left there, for a person to remove.
import fs from 'node:fs';
import path from 'node:path';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const NS = 'com.serupa';
const SCALES = ['spacing', 'radius', 'borders', 'sizing', 'fontSize', 'opacity', 'transitions'];
export const COLLECTIONS = { palette: 'Serupa palette', themes: 'Serupa themes', scales: 'Serupa scales' };

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
function* walk(tree, p = []) {
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$') || !isObj(v)) continue;
    if ('$value' in v) yield [[...p, k], v];
    else yield* walk(v, [...p, k]);
  }
}
const rgba = (v) => ({ r: v.components[0], g: v.components[1], b: v.components[2], a: v.alpha ?? 1 });
const cssVar = (tok, p) => tok.$extensions?.[NS]?.cssVar || '--' + p.join('-');

/** The variables the tokens give: { collection, name, type, description, css, values: { mode: value | { alias } } }. */
export function figmaVariables(dir = path.join(P, 'design-tokens')) {
  const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const base = load('serupa.tokens.json');
  // The themes in tokens.json's order and by its names (Blue Light…), each in its own file here.
  const list = JSON.parse(fs.readFileSync(path.join(dir, '..', 'tokens.json'), 'utf8')).color.themes;
  const themes = list.map((x) => x.id), title = Object.fromEntries(list.map((x) => [x.id, x.name]));
  const index = new Map([...walk(base)].map(([p, t]) => [p.join('.'), t]));
  const resolve = (v) => { for (let i = 0; typeof v === 'string' && /^\{.+\}$/.test(v) && i < 10; i++) v = index.get(v.slice(1, -1))?.$value; return v; };
  const out = [];
  for (const [p, tok] of walk(base)) {
    const css = cssVar(tok, p), description = tok.$description || '';
    if (p[0] === 'color' && tok.$type === 'color') {
      const v = resolve(tok.$value);
      if (isObj(v)) out.push({ collection: COLLECTIONS.palette, name: p.join('/'), type: 'COLOR', description, css, values: { Value: rgba(v) } });
      continue;
    }
    if (!SCALES.includes(p[0])) continue;
    const v = resolve(tok.$value);
    let n = null;
    if (tok.$type === 'dimension' && isObj(v)) n = v.unit === 'rem' ? v.value * 16 : v.value;
    else if (tok.$type === 'duration' && isObj(v)) n = v.unit === 's' ? v.value * 1000 : v.value;
    else if (tok.$type === 'number' && typeof v === 'number' && p[0] === 'opacity') n = v;
    if (n != null) out.push({ collection: COLLECTIONS.scales, name: p.join('/'), type: 'FLOAT', description, css, values: { Value: Number(n.toFixed(4)) } });
  }
  const alias = new Map();
  for (const th of themes) {
    for (const [p, tok] of walk(load(path.join('themes', th + '.tokens.json')))) {
      const name = p.join('/');
      if (!alias.has(name)) alias.set(name, { collection: COLLECTIONS.themes, name, type: 'COLOR', description: tok.$description || '', css: cssVar(tok, p), values: {} });
      const m = /^\{(.+)\}$/.exec(String(tok.$value));
      alias.get(name).values[title[th]] = m ? { alias: m[1].replace(/\./g, '/') } : rgba(tok.$value);
    }
  }
  out.push(...alias.values());
  return { variables: out, modes: { [COLLECTIONS.palette]: ['Value'], [COLLECTIONS.scales]: ['Value'], [COLLECTIONS.themes]: themes.map((th) => title[th]) } };
}

/** The body of POST /v1/files/:key/variables that brings `local` (GET /v1/files/:key/variables/local's meta) up to the tokens. */
export function figmaPayload(local = { variableCollections: {}, variables: {} }, wanted = figmaVariables()) {
  const body = { variableCollections: [], variableModes: [], variables: [], variableModeValues: [] };
  const cols = Object.values(local.variableCollections || {}).filter((c) => !c.remote);
  const vars = Object.values(local.variables || {}).filter((v) => !v.remote);
  const colId = {}, modeId = {}, varId = {};
  for (const [name, modes] of Object.entries(wanted.modes)) {
    const have = cols.find((c) => c.name === name);
    const id = have ? have.id : `col:${name}`;
    colId[name] = id;
    modeId[name] = {};
    if (!have) {
      // A new collection comes with one mode, which takes the first mode's name; the others are added.
      body.variableCollections.push({ action: 'CREATE', id, name, initialModeId: `mode:${name}:${modes[0]}` });
      body.variableModes.push({ action: 'UPDATE', id: `mode:${name}:${modes[0]}`, name: modes[0], variableCollectionId: id });
      modeId[name][modes[0]] = `mode:${name}:${modes[0]}`;
    }
    for (const m of modes) {
      if (modeId[name][m]) continue;
      const found = have?.modes.find((x) => x.name === m);
      if (found) modeId[name][m] = found.modeId;
      else if (have && have.modes.length === 1 && modes.length && m === modes[0] && have.modes[0].name !== m) {
        body.variableModes.push({ action: 'UPDATE', id: have.modes[0].modeId, name: m, variableCollectionId: id });   // "Mode 1"
        modeId[name][m] = have.modes[0].modeId;
      } else {
        const tmp = `mode:${name}:${m}`;
        body.variableModes.push({ action: 'CREATE', id: tmp, name: m, variableCollectionId: id });
        modeId[name][m] = tmp;
      }
    }
  }
  for (const v of wanted.variables) {
    const have = vars.find((x) => x.name === v.name && x.variableCollectionId === colId[v.collection]);
    const codeSyntax = { WEB: `var(${v.css})` };
    if (have) {
      varId[`${v.collection}|${v.name}`] = have.id;
      if (have.description !== v.description || have.codeSyntax?.WEB !== codeSyntax.WEB) body.variables.push({ action: 'UPDATE', id: have.id, description: v.description, codeSyntax });
    } else {
      const id = `var:${v.collection}:${v.name}`;
      varId[`${v.collection}|${v.name}`] = id;
      body.variables.push({ action: 'CREATE', id, name: v.name, variableCollectionId: colId[v.collection], resolvedType: v.type, description: v.description, codeSyntax });
    }
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const v of wanted.variables) {
    const id = varId[`${v.collection}|${v.name}`];
    const have = vars.find((x) => x.id === id);
    for (const [mode, value] of Object.entries(v.values)) {
      const mid = modeId[v.collection][mode];
      const val = value.alias ? { type: 'VARIABLE_ALIAS', id: varId[`${COLLECTIONS.palette}|${value.alias}`] } : value;
      if (value.alias && !val.id) throw new Error(`${v.name} (${mode}) is an alias of ${value.alias}, which isn't a palette variable`);
      const now = have?.valuesByMode?.[mid];
      if (now != null && same(now.type === 'VARIABLE_ALIAS' ? { type: now.type, id: now.id } : now, val)) continue;
      body.variableModeValues.push({ variableId: id, modeId: mid, value: val });
    }
  }
  return body;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const send = process.argv.includes('--send');
  const { FIGMA_TOKEN: token, FIGMA_FILE: file } = process.env;
  if (!send) {
    const b = figmaPayload();
    console.log(`Against an empty file: ${b.variableCollections.length} collections, ${b.variableModes.length} modes, ${b.variables.length} variables, ${b.variableModeValues.length} values. --send to send it.`);
    process.exit(0);
  }
  if (!token || !file) { console.log('FIGMA_TOKEN and FIGMA_FILE are not set: nothing sent.'); process.exit(0); }
  const api = (p, init = {}) => fetch(`https://api.figma.com/v1/files/${file}${p}`, { ...init, headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json', ...(init.headers || {}) } })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`Figma ${r.status}: ${j.message || j.err || JSON.stringify(j)}`); return j; });
  const local = await api('/variables/local');
  const body = figmaPayload(local.meta);
  const n = body.variableCollections.length + body.variableModes.length + body.variables.length + body.variableModeValues.length;
  if (!n) { console.log('The Figma variables already match the tokens.'); process.exit(0); }
  await api('/variables', { method: 'POST', body: JSON.stringify(body) });
  console.log(`Sent ${body.variables.length} variables and ${body.variableModeValues.length} values to Figma.`);
}
