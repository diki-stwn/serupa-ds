// Figma variables (27): what tools/tokens/figma-variables.mjs sends to Figma. Against an empty file it creates the
// three collections, the six theme modes and a variable for every token it carries, with tokens.json's values and
// every theme color an alias of a palette variable; sent once, sending again changes nothing. Figma's side is played
// by a small stand-in that applies the request the way the REST API does (temporary ids become real ones).
// A theme color is an alias of a palette variable, or a color of its own where the palette has none (overlay).
//   node tools/test/figma-variables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';
import { figmaPayload, figmaVariables, COLLECTIONS } from '../tokens/figma-variables.mjs';

const R = [];
const t = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
const tokens = JSON.parse(fs.readFileSync(path.join(PROJECT, 'tokens.json'), 'utf8'));
const themes = tokens.color.themes;

/** Applies a POST /variables body to a file's local variables, as Figma does. */
function apply(local, body) {
  let n = 0;
  const real = new Map();
  const id = (x) => real.get(x) ?? x;
  const L = structuredClone(local);
  for (const c of body.variableCollections) {
    if (c.action !== 'CREATE') continue;
    const cid = `VariableCollectionId:${++n}`, mid = `${++n}:0`;
    real.set(c.id, cid); real.set(c.initialModeId, mid);
    L.variableCollections[cid] = { id: cid, name: c.name, modes: [{ modeId: mid, name: 'Mode 1' }], remote: false };
  }
  for (const m of body.variableModes) {
    const col = L.variableCollections[id(m.variableCollectionId)];
    if (m.action === 'CREATE') { const mid = `${++n}:0`; real.set(m.id, mid); col.modes.push({ modeId: mid, name: m.name }); }
    else col.modes.find((x) => x.modeId === id(m.id)).name = m.name;
  }
  for (const v of body.variables) {
    if (v.action === 'CREATE') {
      const vid = `VariableID:${++n}`;
      real.set(v.id, vid);
      L.variables[vid] = { id: vid, name: v.name, variableCollectionId: id(v.variableCollectionId), resolvedType: v.resolvedType, description: v.description, codeSyntax: v.codeSyntax, valuesByMode: {}, remote: false };
    } else Object.assign(L.variables[id(v.id)], { description: v.description, codeSyntax: v.codeSyntax });
  }
  for (const x of body.variableModeValues) {
    const value = x.value.type === 'VARIABLE_ALIAS' ? { type: 'VARIABLE_ALIAS', id: id(x.value.id) } : x.value;
    L.variables[id(x.variableId)].valuesByMode[id(x.modeId)] = value;
  }
  return L;
}

const empty = { variableCollections: {}, variables: {} };
const body = figmaPayload(empty);
t('against an empty file: the three collections, and the theme collection gets a mode per theme',
  body.variableCollections.length === 3 && body.variableModes.filter((m) => m.variableCollectionId === `col:${COLLECTIONS.themes}`).length === themes.length,
  JSON.stringify(body.variableModes.map((m) => m.name)));
const file = apply(empty, body);
const cols = Object.values(file.variableCollections), vars = Object.values(file.variables);
const col = (name) => cols.find((c) => c.name === name);
const themeModes = col(COLLECTIONS.themes).modes.map((m) => m.name);
t(`the theme modes are named after the themes, in tokens.json's order (${themeModes.join(', ')})`, themeModes.join() === themes.map((x) => x.name).join());

// Every value against tokens.json itself
const all = new Map();
for (const g of Object.values(tokens)) if (g && Array.isArray(g.tokens)) for (const x of g.tokens) all.set(x.name, x);
const at = (name, th) => {
  let v = all.get(name)?.value;
  for (let i = 0; i < 10; i++) {
    if (v && typeof v === 'object') v = v[th] ?? Object.values(v)[0];
    const m = /^\{([^}]+)\}$/.exec(String(v));
    if (!m) break;
    v = all.get(m[1])?.value;
  }
  return String(v);
};
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('') + (c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
const cssName = (v) => /^var\(--(.+)\)$/.exec(v.codeSyntax?.WEB || '')?.[1];
const wrong = [];
let palette = 0, scales = 0, themed = 0;
for (const v of vars) {
  const name = cssName(v), c = file.variableCollections[v.variableCollectionId];
  if (!all.has(name)) { wrong.push(`${v.name}: var(--${name}) isn't a token`); continue; }
  for (const m of c.modes) {
    const th = themes.find((x) => x.name === m.name)?.id || themes[0].id;
    const want = at(name, th);
    let got = v.valuesByMode[m.modeId];
    if (got == null) { wrong.push(`${v.name} has no value in ${m.name}`); continue; }
    if (got.type === 'VARIABLE_ALIAS') {
      const to = file.variables[got.id];
      if (!to || file.variableCollections[to.variableCollectionId].name !== COLLECTIONS.palette) { wrong.push(`${v.name} (${m.name}) is an alias of something not in the palette`); continue; }
      got = Object.values(to.valuesByMode)[0];
    }
    if (c.name === COLLECTIONS.themes) themed++;
    if (v.resolvedType === 'COLOR') { if (hex(got) !== want.toLowerCase()) wrong.push(`${v.name} (${m.name}): ${hex(got)}, tokens.json says ${want}`); }
    else {
      const n = /^(-?\d*\.?\d+)(px|rem|ms|%)?$/.exec(want);
      const expect = n && (n[2] === 'rem' ? parseFloat(n[1]) * 16 : n[2] === '%' ? parseFloat(n[1]) / 100 : parseFloat(n[1]));
      if (expect == null || Math.abs(got - expect) > 1e-3) wrong.push(`${v.name}: ${got}, tokens.json says ${want}`);
    }
  }
  if (c.name === COLLECTIONS.palette) palette++; else if (c.name === COLLECTIONS.scales) scales++;
}
const aliasTokens = tokens.color.tokens.filter((x) => x.value && typeof x.value === 'object' && Object.keys(x.value).length > 1).length;
const want = figmaVariables().variables.length;
t(`${vars.length} variables, one per token carried (${palette} palette colors, ${scales} scale values, ${aliasTokens} theme colors × ${themes.length}), each equal to tokens.json in every mode`,
  vars.length === want && palette > 200 && scales > 100 && themed === aliasTokens * themes.length && !wrong.length, wrong.slice(0, 8).join('; '));
const noCode = vars.filter((v) => !cssName(v));
t('each variable shows its CSS variable as its code syntax, for Dev Mode', !noCode.length, noCode.slice(0, 5).map((v) => v.name).join(', '));
const badName = vars.filter((v) => /[.{}]/.test(v.name));
t('variable names use / for groups and none of the characters Figma refuses (. { })', !badName.length, badName.slice(0, 5).map((v) => v.name).join(', '));

// Sending again changes nothing; and a file whose value was changed by hand gets just that value back
const again = figmaPayload(file);
const count = (b) => b.variableCollections.length + b.variableModes.length + b.variables.length + b.variableModeValues.length;
t('sent once, sending again changes nothing', count(again) === 0, JSON.stringify(again).slice(0, 300));
const edited = structuredClone(file);
const sp = Object.values(edited.variables).find((v) => cssName(v) === 'spacing-4');
sp.valuesByMode[Object.keys(sp.valuesByMode)[0]] = 99;
const fix = figmaPayload(edited);
t('a value changed in Figma by hand is set back, and nothing else is sent', fix.variableModeValues.length === 1 && fix.variableModeValues[0].value === 16 && count(fix) === 1, JSON.stringify(fix.variableModeValues));
done(report('Figma variables', R));
