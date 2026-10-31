// Own props stay off the DOM: every component hands the props it doesn't use itself to its DOM element through
// omit(props, { size: 1, … }). A prop the component declares, that isn't an HTML or ARIA attribute and isn't in
// that list, would land on the element as a stray attribute (size="lg" on a <div>, options="[object Object]").
// This reads every omit() call with the TypeScript checker and lists those props.
// And the guides' Props sections keep up with the types: every prop a component's folder declares on an exported
// …Props type is named in its README's Props section (in a table row or the text around it), and every name a
// Props table row starts with is a real prop, export or option of that folder.
// And the callbacks follow the API conventions in CONTRIBUTING.md: a component's own on…Change callback is named
// for the prop it reports (onOpenChange for open, onPressedChange for pressed, onValueChange for value), and only a
// wrapper of a native element, which takes value and onChange from React's own types, has a plain onChange.
// And booleans are named in the positive (CONTRIBUTING.md): for what they turn on or show, never noX, xHidden, enabled
// or disableX; hideX turns a part off.
//   node tools/test/props.mjs
import fs from 'node:fs';
import path from 'node:path';
// TypeScript 7 has no compiler API yet, so this reads the types with TypeScript 6's (see tools/typescript/api.mjs).
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const config = ts.getParsedCommandLineOfConfigFile(path.join(PROJECT, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const SRC = path.join(PROJECT, 'src') + path.sep;

// The names React passes to a DOM element as they are: every HTML and ARIA attribute and event handler, from
// React's own types (React.AllHTMLAttributes & React.SVGAttributes), plus ref, key and children.
const types = program.getSourceFiles().find((f) => /node_modules[\\/]@types[\\/]react[\\/]index\.d\.ts$/.test(f.fileName));
const react = types && types.statements.find((s) => ts.isModuleDeclaration(s) && s.name.getText() === 'React');
const DOM = new Set(['ref', 'key', 'children']);
const walk = (n) => {
  if (ts.isInterfaceDeclaration(n) && ['AllHTMLAttributes', 'SVGAttributes'].includes(n.name.text)) {
    for (const p of checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(n.name)).getProperties()) DOM.add(p.name);
  }
  ts.forEachChild(n, walk);
};
if (react) walk(react);
const isDom = (name) => DOM.has(name) || /^(aria|data)-/.test(name);

const R = [];
let calls = 0;
for (const file of program.getSourceFiles()) {
  if (!file.fileName.startsWith(SRC) || !/[\\/]components[\\/]/.test(file.fileName) || /\.(test|stories)\.tsx$/.test(file.fileName)) continue;
  const visit = (n) => {
    if (ts.isCallExpression(n) && n.expression.getText(file) === 'omit' && n.arguments.length === 2) {
      calls++;
      // The list is written in place or in a constant (const OWN = { … } as const); its type names the keys either way.
      const listed = new Set(checker.getTypeAtLocation(n.arguments[1]).getProperties().map((p) => p.name));
      const leaks = checker.getTypeAtLocation(n.arguments[0]).getProperties()
        // Declared in this system (not inherited from React's DOM types), not handed on by name, not a DOM attribute.
        .filter((p) => (p.declarations || []).some((d) => d.getSourceFile().fileName.startsWith(SRC)))
        .map((p) => p.name)
        .filter((name) => !listed.has(name) && !isDom(name));
      const at = `${path.relative(PROJECT, file.fileName)}:${file.getLineAndCharacterOfPosition(n.getStart(file)).line + 1}`;
      R.push({ name: `${at}: every own prop that isn't an HTML attribute is kept off the DOM`, ok: !leaks.length, detail: leaks.length ? `not in the omit() list: ${[...new Set(leaks)].join(', ')}` : '' });
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
}
// Props sections. Left out: children, and props tagged @internal or @deprecated (kept only to warn).
const DIR = path.join(SRC, 'components');
const NAME = /`([A-Za-z_$][\w$-]*)/g;   // a code span's first word: `size`, `aria-label`, `keepMounted={false}`
const real = (s) => (s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s);
let guides = 0;
// Callbacks that don't follow the naming yet, each with why. An entry that comes to follow it fails too, so this
// list only shrinks.
const NAMING_GAPS = {
  'ComboboxProps.onInputChange': 'reports the typed text, which has no prop of its own: the input is never controlled',
  'ComboboxSingleProps.onInputChange': 'reports the typed text, which has no prop of its own: the input is never controlled',
  'ComboboxMultipleProps.onInputChange': 'reports the typed text, which has no prop of its own: the input is never controlled',
};
// Booleans that don't follow the naming yet, each with why. Like NAMING_GAPS, this list only shrinks.
const BOOLEAN_GAPS = {
  'TableProps.captionHidden': 'xHidden: to be deprecated for hideCaption (SG3), one component pull request',
};
const NEGATIVE = /^(no|not|dont|without|disable)[A-Z]|[a-z]Hidden$|^enabled$/;
const isBoolean = (p) => {
  const d = (p.declarations || [])[0];
  const t = d && checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(p, d));
  return !!t && (!!(t.flags & ts.TypeFlags.Boolean) || (t.isUnion() && t.types.every((u) => !!(u.flags & ts.TypeFlags.BooleanLiteral))));
};
const booleanGaps = new Set();
let booleans = 0;
const gaps = new Set();
let callbacks = 0;
const lower = (x) => x[0].toLowerCase() + x.slice(1);
for (const name of fs.readdirSync(DIR).sort()) {
  const index = program.getSourceFile(path.join(DIR, name, 'index.ts'));
  const readme = path.join(DIR, name, 'README.md');
  if (!index || !fs.existsSync(readme)) continue;
  guides++;
  const folder = path.join(DIR, name) + path.sep;
  const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(index));
  const own = new Set(), known = new Set(exports.map((e) => e.name));
  for (const e of exports) {
    const s = real(e);
    if (!(s.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
    for (const p of checker.getDeclaredTypeOfSymbol(s).getProperties()) {
      known.add(p.name);
      const decls = p.declarations || [];
      if (!/Props$/.test(e.name) || p.name === 'children' || !decls.some((d) => d.getSourceFile().fileName.startsWith(folder))) continue;
      if (ts.getJSDocTags(decls[0]).some((tag) => ['internal', 'deprecated'].includes(tag.tagName.text))) continue;
      own.add(p.name);
    }
  }
  for (const e of exports) {
    const s = real(e);
    if (!/Props$/.test(e.name) || !(s.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
    const props = checker.getDeclaredTypeOfSymbol(s).getProperties();
    const mine = (p) => (p.declarations || []).some((d) => d.getSourceFile().fileName.startsWith(SRC));
    // A @deprecated prop keeps its old name on purpose, to warn and point at the new one.
    const kept = (p) => ts.getJSDocTags((p.declarations || [])[0]).some((tag) => tag.tagName.text === 'deprecated');
    const value = props.find((p) => p.name === 'value');
    for (const p of props.filter((q) => mine(q) && !kept(q) && isBoolean(q))) {
      booleans++;
      const key = `${e.name}.${p.name}`, wrong = NEGATIVE.test(p.name);
      if (key in BOOLEAN_GAPS) { booleanGaps.add(key); R.push({ name: `${name}: ${key} is still a known gap (${BOOLEAN_GAPS[key]})`, ok: wrong, detail: wrong ? '' : 'it reads in the positive now: take it out of BOOLEAN_GAPS' }); }
      else if (wrong) R.push({ name: `${name}: ${key} is named in the positive`, ok: false, detail: `name it for what it turns on or shows (CONTRIBUTING.md, API conventions): hideX to turn a part off, a part shown by default turned off with ={false}; never noX, xHidden, enabled or disableX` });
    }
    for (const p of props.filter((q) => mine(q) && /^on\w*Change$/.test(q.name))) {
      callbacks++;
      const x = p.name.slice(2, -6), key = `${e.name}.${p.name}`;
      // onChange beside the component's own value is a composite's callback: onValueChange. Beside a value from
      // React's types it is the native element's own.
      const why = x ? (props.some((q) => q.name === lower(x)) ? '' : `${p.name} reports no prop: there's no ${lower(x)}`)
        : (value && mine(value) ? 'onChange beside its own value: a composite reports its value with onValueChange' : '');
      if (key in NAMING_GAPS) { gaps.add(key); R.push({ name: `${name}: ${key} is still a known gap (${NAMING_GAPS[key]})`, ok: !!why, detail: why ? '' : 'it follows the conventions now: take it out of NAMING_GAPS' }); }
      else if (why) R.push({ name: `${name}: ${key} follows the API conventions`, ok: false, detail: why });
    }
  }
  const section = (/^## Props\s*$([\s\S]*?)(?=^## )/m.exec(fs.readFileSync(readme, 'utf8')) || [])[1] ?? '';
  const named = new Set([...section.matchAll(NAME)].map((m) => m[1]));
  const rows = [...section.matchAll(/^\|\s*([^|]+?)\s*\|/gm)].map((m) => m[1]).filter((c) => !/^(Prop|-+)$/.test(c));
  const unknown = rows.flatMap((c) => [...c.matchAll(NAME)].map((m) => m[1])).filter((n) => !known.has(n));
  const missing = [...own].filter((n) => !named.has(n));
  R.push({ name: `${name}: the guide's Props section names every prop, and its table names only real ones`, ok: !missing.length && !unknown.length,
    detail: [missing.length && `not in the guide: ${missing.join(', ')}`, unknown.length && `in the table but not a prop: ${unknown.join(', ')}`].filter(Boolean).join('; ') });
}
for (const key of Object.keys(BOOLEAN_GAPS).filter((k) => !booleanGaps.has(k))) R.push({ name: `${key} in BOOLEAN_GAPS is still a boolean`, ok: false, detail: 'no such prop now: take it out of BOOLEAN_GAPS' });
for (const key of Object.keys(NAMING_GAPS).filter((k) => !gaps.has(k))) R.push({ name: `${key} in NAMING_GAPS is still a callback`, ok: false, detail: 'no such prop now: take it out of NAMING_GAPS' });
R.unshift({ name: `React's DOM attribute list was read (${DOM.size} names), omit() calls were found (${calls}), the guides read (${guides}), the on…Change callbacks (${callbacks}) and the booleans (${booleans})`, ok: DOM.size > 500 && calls > 40 && guides > 60 && callbacks > 20 && booleans > 100, detail: `${guides} guides` });
done(report('Props', R));
