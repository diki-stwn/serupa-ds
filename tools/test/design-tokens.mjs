// Checks design-tokens/ (the W3C Design Tokens export): in step with tokens.json, valid against the format
// (DTCG 2025.10) and against design-tokens/tokens.schema.json, every reference resolves, and every token in
// tokens.json is exported somewhere.
//
//   node tools/test/design-tokens.mjs [project dir]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { HERE, projectArg, report, done, fail } from './lib.mjs';

const P = projectArg();
const D = path.join(P, 'design-tokens');
const BASE_FILE = 'serupa.tokens.json';
const NS = 'com.serupa';
const R = [];
const check = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const r = spawnSync(process.execPath, [path.join(HERE, '..', 'tokens', 'export.mjs'), '--check'], { cwd: P, encoding: 'utf8' });
check('design-tokens/ is in step with tokens.json', r.status === 0, (r.stdout || '').trim());
if (r.status !== 0 && !fs.existsSync(path.join(D, BASE_FILE))) fail(`design-tokens/${BASE_FILE} is missing: ${(r.stdout || '').trim()}`);

const base = load(path.join(D, BASE_FILE));
const themes = Object.fromEntries(fs.readdirSync(path.join(D, 'themes')).sort().map((f) => [f.slice(0, -'.tokens.json'.length), load(path.join(D, 'themes', f))]));
const cssOnly = load(path.join(D, 'css-values.json'));

const schema = load(path.join(D, 'tokens.schema.json'));
const TYPES = new Set(schema.$defs.type.enum);   // the format's types, as the schema lists them
function* tokens(tree, p = []) {
  for (const [k, v] of Object.entries(tree)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) yield [[...p, k], v];
    else yield* tokens(v, [...p, k]);
  }
}
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isRef = (v) => typeof v === 'string' && /^\{[^{}]+\}$/.test(v);
const okColor = (v) => isRef(v) || (isObj(v) && v.colorSpace === 'srgb' && Array.isArray(v.components) && v.components.length === 3 && v.components.every((c) => c >= 0 && c <= 1)
  && (v.alpha ?? 1) >= 0 && (v.alpha ?? 1) <= 1 && /^#[0-9a-f]{6}$/.test(v.hex ?? '#000000'));
const okDim = (v) => isRef(v) || (isObj(v) && isNum(v.value) && ['px', 'rem'].includes(v.unit));
const okLayer = (v) => isObj(v) && okColor(v.color) && ['offsetX', 'offsetY', 'blur', 'spread'].every((k) => okDim(v[k])) && typeof (v.inset ?? false) === 'boolean';
const SHAPE = {
  color: okColor, dimension: okDim,
  fontFamily: (v) => isRef(v) || typeof v === 'string' || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string')),
  fontWeight: (v) => isRef(v) || (isNum(v) && v >= 1 && v <= 1000),
  duration: (v) => isRef(v) || (isObj(v) && isNum(v.value) && ['ms', 's'].includes(v.unit)),
  cubicBezier: (v) => isRef(v) || (Array.isArray(v) && v.length === 4 && v[0] >= 0 && v[0] <= 1 && v[2] >= 0 && v[2] <= 1),
  number: (v) => isRef(v) || isNum(v),
  shadow: (v) => isRef(v) || okLayer(v) || (Array.isArray(v) && v.length > 0 && v.every(okLayer)),
  typography: (v) => isObj(v) && ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'].every((k) => k in v),
};
const badType = [], badValue = [], badName = [];
const allFiles = [[BASE_FILE, base], ...Object.entries(themes).map(([k, v]) => [`themes/${k}.tokens.json`, v])];
const compDir = path.join(D, 'components');
if (fs.existsSync(compDir)) for (const f of fs.readdirSync(compDir).sort()) allFiles.push([`components/${f}`, load(path.join(compDir, f))]);
for (const [f, tree] of allFiles) {
  for (const [p, tok] of tokens(tree)) {
    if (p.some((x) => /[.{}]|^\$/.test(x))) badName.push(p.join('.'));
    const ty = tok.$type;
    if (!TYPES.has(ty)) { badType.push(`${f}: ${p.join('.')} (${ty})`); continue; }
    if (SHAPE[ty] && !SHAPE[ty](tok.$value)) badValue.push(`${f}: ${p.join('.')}`);
  }
}
check('every token has a standard $type', !badType.length, badType.slice(0, 8).join('; '));
check('every $value has the shape its type requires', !badValue.length, badValue.slice(0, 8).join('; '));
check('token names avoid the reserved characters . { } and a leading $', !badName.length, badName.slice(0, 8).join('; '));

// The JSON Schema shipped for editors and pipelines: it must accept every file, and turn down what the checks above do,
// so the two can't drift apart.
const validate = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true }).compile(schema);
const schemaBad = allFiles.flatMap(([f, tree]) => validate(tree) ? [] : [`${f}: ${validate.errors.slice(0, 2).map((e) => `${e.instancePath} ${e.message}`).join(', ')}`]);
check('every file is valid against tokens.schema.json', !schemaBad.length, schemaBad.slice(0, 4).join('; '));
const WRONG = {
  'a token without $type': { a: { $value: 1 } },
  'an unknown $type': { a: { $type: 'colour', $value: '#fff' } },
  'a color as a hex string': { a: { $type: 'color', $value: '#ffffff' } },
  'a dimension in em': { a: { $type: 'dimension', $value: { value: 1, unit: 'em' } } },
  'a shadow without spread': { a: { $type: 'shadow', $value: { color: '{c}', offsetX: '{d}', offsetY: '{d}', blur: '{d}' } } },
  'a name with a dot': { 'a.b': { $type: 'number', $value: 1 } },
  'an unknown key on a token': { a: { $type: 'number', $value: 1, value: 1 } },
};
const passed = Object.keys(WRONG).filter((k) => validate(WRONG[k]));
check('tokens.schema.json turns down what the format does not allow', !passed.length, passed.join(', '));

const index = new Set([...tokens(base)].map(([p]) => p.join('.')));
for (const [p] of tokens(Object.values(themes)[0])) index.add(p.join('.'));   // component tokens may point at theme aliases
function* refs(v) {
  if (isRef(v)) yield v.slice(1, -1);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) yield* refs(x);
}
const unres = [];
for (const [f, tree] of allFiles) for (const [p, tok] of tokens(tree)) for (const rf of refs(tok.$value)) if (!index.has(rf)) unres.push(`${f}: ${p.join('.')} → {${rf}}`);
check(`every reference resolves (to ${BASE_FILE} or a theme alias)`, !unres.length, unres.slice(0, 8).join('; '));

const src = load(path.join(P, 'tokens.json'));
const exported = new Set();
for (const [, tree] of allFiles) for (const [, tok] of tokens(tree)) { const v = tok.$extensions?.[NS]?.cssVar; if (v) exported.add(v.slice(2)); }
for (const v of Object.values(cssOnly)) if (isObj(v)) for (const n of Object.keys(v)) exported.add(n);
const missing = Object.values(src).filter((g) => isObj(g) && Array.isArray(g.tokens)).flatMap((g) => g.tokens).map((x) => x.name).filter((n) => !exported.has(n));
check('every token in tokens.json is exported (typed, as an alias, or as a CSS value)', !missing.length, missing.slice(0, 10).join(', '));
const nAlias = new Set(Object.values(themes).map((t) => Object.keys(t.color || {}).length));
check(`each of the ${Object.keys(themes).length} theme files has the same aliases`, nAlias.size === 1, [...nAlias].join(', '));
done(report('Design tokens', R));
