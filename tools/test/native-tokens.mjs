// Tokens for native apps (138): dist/native/ holds the Swift, Kotlin and Android resource files, in step with
// tokens.json. Each value is checked against tokens.json itself (not the generator's own reading of design-tokens/),
// in every theme, and every name is a valid identifier, unique, and the same in each file.
//   node tools/test/native-tokens.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail = '') => R.push({ name, ok: !!ok, detail });
const D = path.join(PROJECT, 'dist', 'native');
const read = (f) => { try { return fs.readFileSync(path.join(D, f), 'utf8'); } catch { return null; } };
const tokens = JSON.parse(fs.readFileSync(path.join(PROJECT, 'tokens.json'), 'utf8'));
const themes = tokens.color.themes.map((x) => x.id);
const brands = [...new Set(themes.map((x) => x.split('-')[0]))];

const FILES = ['ios/SerupaTokens.swift', 'android/SerupaTokens.kt', 'android/res/values/serupa_tokens.xml',
  ...brands.flatMap((b) => [`android/res-${b}/values/serupa_colors.xml`, `android/res-${b}/values-night/serupa_colors.xml`])];
const missing = FILES.filter((f) => read(f) == null);
t(`dist/native/ has the ${FILES.length} files (npm run build)`, !missing.length, missing.join(', '));
if (missing.length) done(report('Native tokens', R));

// tokens.json, resolved by name in one theme ({blue-600} → #2563eb; a value per theme takes that theme's)
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
const px = (v) => { const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(v); return m ? parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1) : null; };
const ratio = (v) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
const argb = (v) => {
  const h = v.replace('#', '').toUpperCase();
  return h.length === 8 ? h.slice(6) + h.slice(0, 6) : 'FF' + h;
};
const near = (a, b) => Math.abs(a - b) < 1e-3;

// Android resources: every name is serupa_<token name>, and every value equals tokens.json's
const xml = read('android/res/values/serupa_tokens.xml');
const entries = (s) => [...s.matchAll(/<(color|dimen|integer|item) name="([^"]+)"[^>]*>([^<]+)<\/\1>/g)].map((m) => ({ kind: m[1], name: m[2], value: m[3] }));
const byXml = new Map([...all.keys()].map((n) => ['serupa_' + n.replace(/[.-]+/g, '_'), n]));
const res = entries(xml);
const wrong = [];
for (const e of res) {
  const n = byXml.get(e.name), v = n && at(n, themes[0]);
  if (!n) { wrong.push(`${e.name}: no such token`); continue; }
  const ok = e.kind === 'color' ? e.value === '#' + argb(v) : e.kind === 'dimen' ? near(parseFloat(e.value), px(v)) && /(dp|sp)$/.test(e.value) : e.kind === 'item' ? near(parseFloat(e.value), ratio(v)) : parseInt(e.value, 10) === parseInt(v, 10) && /ms$/.test(v);
  if (!ok) wrong.push(`${e.name}: ${e.value}, tokens.json says ${v}`);
}
const has = (k) => res.filter((e) => e.kind === k).length;
t(`serupa_tokens.xml: ${has('color')} palette colors, ${has('dimen')} sizes, ${has('integer')} durations and ${has('item')} opacities, each equal to tokens.json`, has('color') > 200 && has('dimen') > 100 && has('integer') > 20 && has('item') > 20 && !wrong.length, wrong.slice(0, 8).join('; '));
const themeWrong = [];
let aliasCount = 0;
for (const th of themes) {
  const [b, mode] = th.split('-');
  const list = entries(read(`android/res-${b}/values${mode === 'dark' ? '-night' : ''}/serupa_colors.xml`));
  aliasCount = list.length;
  for (const e of list) { const v = at(byXml.get(e.name), th); if (e.value !== '#' + argb(v)) themeWrong.push(`${th} ${e.name}: ${e.value}, tokens.json says ${v}`); }
}
const aliases = tokens.color.tokens.filter((x) => x.value && typeof x.value === 'object' && Object.keys(x.value).length > 1).length;
t(`each brand's values/ and values-night/ hold the ${aliases} alias colors of its light and dark theme`, aliasCount === aliases && !themeWrong.length, themeWrong.slice(0, 8).join('; '));

// Swift and Kotlin: the same tokens as the resources, by the same names, with the same values
// a token name in camelCase: blue-600 → blue600, spacing-0.5 → spacing0_5, text-base--line-height → textBaseLineHeight
const camel = (n) => n.replace(/\./g, '_').replace(/-+([a-z0-9])/g, (_, c) => c.toUpperCase());
const swift = read('ios/SerupaTokens.swift'), kt = read('android/SerupaTokens.kt');
const SWIFT_WORDS = new Set(['default', 'internal', 'private', 'public', 'static', 'class', 'struct', 'enum', 'let', 'var', 'func', 'in', 'is', 'as', 'self', 'super', 'true', 'false', 'nil', 'case', 'where', 'repeat', 'extension', 'protocol', 'operator', 'import', 'init', 'deinit', 'subscript', 'typealias', 'inout', 'return', 'throw', 'throws', 'try', 'catch', 'do', 'if', 'else', 'guard', 'switch', 'for', 'while', 'break', 'continue', 'fallthrough', 'defer', 'Type', 'Self', 'Any', 'some', 'any']);
const KT_WORDS = new Set(['as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while']);
const block = (s, open) => { const i = s.indexOf(open); return i < 0 ? '' : s.slice(i, s.indexOf('\n}', i)); };
const swiftNames = (s) => [...s.matchAll(/public (?:static )?let (\w+)/g)].map((m) => m[1]);
const ktNames = (s) => [...s.matchAll(/(?:const )?val (\w+)(?: =|:)/g)].map((m) => m[1]);
const scopes = {
  'Swift SerupaTokens': swiftNames(block(swift, 'public enum SerupaTokens')), 'Swift SerupaPalette': swiftNames(block(swift, 'public enum SerupaPalette')),
  'Kotlin SerupaTokens': ktNames(block(kt, 'object SerupaTokens')), 'Kotlin SerupaPalette': ktNames(block(kt, 'object SerupaPalette')),
};
const want = { Tokens: res.filter((e) => e.kind !== 'color').map((e) => camel(byXml.get(e.name))), Palette: res.filter((e) => e.kind === 'color').map((e) => camel(byXml.get(e.name))) };
const badNames = [];
for (const [scope, names] of Object.entries(scopes)) {
  const words = scope.startsWith('Swift') ? SWIFT_WORDS : KT_WORDS;
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  const invalid = names.filter((n) => !/^[a-z][A-Za-z0-9_]*$/.test(n) || words.has(n));
  const w = want[scope.split('Serupa')[1]];
  if (dup.length || invalid.length || names.join() !== w.join()) badNames.push(`${scope}: ${dup.length} twice, invalid ${invalid.slice(0, 4).join(' ')}, ${names.length} of ${w.length} expected`);
}
t('Swift and Kotlin name every token as the resources do (camelCase), each a valid identifier, none twice', !badNames.length, badNames.join('; '));

// Values in Swift and Kotlin: a few of every kind, checked by their own token
const val = (src, re) => { const m = re.exec(src); return m && m[1]; };
const checks = [];
for (const e of res) {
  const n = byXml.get(e.name), id = camel(n), v = at(n, themes[0]);
  const sv = val(swift, new RegExp(`public static let ${id}(?:: \\w+)? = ([^\\n]+)`)), kv = val(kt, new RegExp(`val ${id} = ([^\\n]+)`));
  if (e.kind === 'color') {
    const c = argb(v), comps = [2, 4, 6].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
    const sm = /red: ([\d.]+), green: ([\d.]+), blue: ([\d.]+), opacity: ([\d.]+)/.exec(sv || '');
    if (!sm || ![1, 2, 3].every((i) => near(parseFloat(sm[i]), comps[i - 1])) || !near(parseFloat(sm[4]), parseInt(c.slice(0, 2), 16) / 255)) checks.push(`Swift ${id}: ${sv}, tokens.json says ${v}`);
    if (kv !== `Color(0x${c})`) checks.push(`Kotlin ${id}: ${kv}, tokens.json says ${v}`);
  } else if (e.kind === 'dimen') {
    if (!near(parseFloat(sv), px(v))) checks.push(`Swift ${id}: ${sv}, tokens.json says ${v}`);
    if (!kv || !near(parseFloat(kv), px(v)) || !/\.(dp|sp)$/.test(kv)) checks.push(`Kotlin ${id}: ${kv}, tokens.json says ${v}`);
  } else if (e.kind === 'item') {
    if (!near(parseFloat(sv), ratio(v)) || !near(parseFloat(kv), ratio(v)) || !kv.endsWith('f')) checks.push(`${id}: Swift ${sv}, Kotlin ${kv}, tokens.json says ${v}`);
  } else {
    if (!near(parseFloat(sv) * 1000, parseInt(v, 10))) checks.push(`Swift ${id}: ${sv} s, tokens.json says ${v}`);
    if (kv !== `${parseInt(v, 10)}L`) checks.push(`Kotlin ${id}: ${kv}, tokens.json says ${v}`);
  }
}
t('every palette color, size, duration and opacity has the same value in Swift (points, seconds) and Kotlin (dp, sp, ms)', !checks.length, checks.slice(0, 8).join('; '));
const perTheme = [];
for (const th of themes) {
  const sw = block(swift, `public static let ${camel(th)} = SerupaColors(`);
  const kb = block(kt, `val ${th.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')} = SerupaColors(`);
  for (const x of tokens.color.tokens.filter((y) => y.value && typeof y.value === 'object' && Object.keys(y.value).length > 1)) {
    const id = camel(x.name), c = argb(at(x.name, th));
    if (!new RegExp(`\\b${id} = Color\\(0x${c}\\)`).test(kb)) perTheme.push(`Kotlin ${th} ${id}`);
    const sm = new RegExp(`\\b${id}: Color\\(\\.sRGB, red: ([\\d.]+), green: ([\\d.]+), blue: ([\\d.]+)`).exec(sw);
    if (!sm || ![1, 2, 3].every((i) => near(parseFloat(sm[i]), parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255))) perTheme.push(`Swift ${th} ${id}`);
  }
}
t(`SerupaColors has each theme's ${aliases} alias colors in Swift and Kotlin`, !perTheme.length, perTheme.slice(0, 8).join('; '));
done(report('Native tokens', R));
