// Coverage per prop value, not per file: every value of a component's option props (a prop typed as a short union
// of strings, like variant?: 'primary' | 'secondary' or placement?: 'top' | 'bottom') shows in one of its folder's
// stories or tests, written as a string ('primary', "primary" or `primary`), or is the value the component falls
// back to when the prop is left out. Line coverage counts a file as run once any value runs it; a value no story
// renders and no test sets can break unseen.
// The default is read from the component's own code: a destructuring default (size = "md"), oneOf(…, props.size,
// "md"), props.variant || "outline" and props.variant ?? "outline", or, for a prop of two values, the one the code
// doesn't test for (props.orientation === "vertical" makes "horizontal" the default).
// Left out: unions of more than 12 values (element names, icon names) and props that retype a native attribute
// (as, type, role, popoverTargetAction), whose values the browser handles.
//   node tools/test/prop-values.mjs
import fs from 'node:fs';
import path from 'node:path';
// TypeScript 7 has no compiler API yet, so this reads the types with TypeScript 6's (see tools/typescript/api.mjs).
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const config = ts.getParsedCommandLineOfConfigFile(path.join(PROJECT, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const SRC = path.join(PROJECT, 'src') + path.sep;
const DIR = path.join(SRC, 'components');
const NATIVE = new Set(['as', 'type', 'role', 'popoverTargetAction']);
const real = (s) => (s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s);

// Values no story or test shows yet, each with why. One that comes to be shown fails too, so this list only shrinks.
const GAPS = Object.fromEntries([
  'Checkbox.orientation=horizontal',
  'Container.size=2xl',
  'CopyButton.size=lg', 'CopyButton.variant=link', 'CopyButton.variant=primary',
  'Heading.size=sm', 'Heading.size=base', 'Heading.size=xl', 'Heading.size=2xl', 'Heading.size=3xl', 'Heading.size=5xl',
  'IconButton.variant=link',
  'Menu.placement=left', 'Menu.placement=right-end', 'Menu.placement=left-start', 'Menu.placement=left-end',
  'Navbar.size=prose', 'Navbar.size=md', 'Navbar.size=2xl', 'Navbar.size=full',
  'Popover.placement=top-end', 'Popover.placement=right-end', 'Popover.placement=left-start', 'Popover.placement=left-end',
  'Stack.align=start', 'Stack.align=baseline',
  'Table.align=center',
  'Toast.position=top-start', 'Toast.position=bottom-center',
  'ToggleButton.size=sm', 'ToggleButton.size=md', 'ToggleButton.size=lg',
  'ToggleGroup.size=md',
  'Tooltip.placement=bottom-start', 'Tooltip.placement=top-end', 'Tooltip.placement=right-end', 'Tooltip.placement=left-start', 'Tooltip.placement=left-end',
].map((k) => [k, 'F8: no story or test shows it yet']));

// The values a component falls back to, read from the code of its folder (not its stories or tests).
function defaults(folder, options) {
  const found = new Set();
  const tested = new Map();   // prop → the values the code compares it with
  const prop = (n, sf) => n.getText(sf).replace(/^props\./, '');
  for (const f of fs.readdirSync(folder).filter((f) => /^[A-Z]\w*\.tsx$/.test(f) && !/\.(test|stories)\.tsx$/.test(f))) {
    const sf = program.getSourceFile(path.join(folder, f));
    if (!sf) continue;
    const visit = (n) => {
      if (ts.isBindingElement(n) && n.initializer && ts.isStringLiteral(n.initializer)) found.add(`${(n.propertyName || n.name).getText(sf)}=${n.initializer.text}`);
      if (ts.isCallExpression(n) && n.expression.getText(sf) === 'oneOf' && n.arguments.length === 3 && ts.isStringLiteral(n.arguments[2])) found.add(`${prop(n.arguments[1], sf)}=${n.arguments[2].text}`);
      if (ts.isBinaryExpression(n) && ts.isStringLiteral(n.right)) {
        const op = n.operatorToken.kind;
        if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) found.add(`${prop(n.left, sf)}=${n.right.text}`);
        if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
          const p = prop(n.left, sf);
          tested.set(p, (tested.get(p) || new Set()).add(n.right.text));
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  for (const [p, values] of options) {
    const t = tested.get(p);
    if (values.length === 2 && t && t.size === 1) found.add(`${p}=${values.find((v) => !t.has(v))}`);
  }
  return found;
}

const R = [];
const shown = new Set();
for (const name of fs.readdirSync(DIR).sort()) {
  const index = program.getSourceFile(path.join(DIR, name, 'index.ts'));
  if (!index) continue;
  const folder = path.join(DIR, name);
  // Stories and tests, less the argTypes option lists, which only fill a control and render nothing.
  const text = fs.readdirSync(folder).filter((f) => /\.(stories|test)\.tsx$/.test(f)).map((f) => fs.readFileSync(path.join(folder, f), 'utf8')).join('\n')
    .split('\n').filter((l) => !/options:\s*\[/.test(l)).join('\n');
  const options = new Map();
  for (const e of checker.getExportsOfModule(checker.getSymbolAtLocation(index))) {
    const s = real(e);
    if (!/Props$/.test(e.name) || !(s.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) continue;
    for (const p of checker.getDeclaredTypeOfSymbol(s).getProperties()) {
      if (NATIVE.has(p.name) || !(p.declarations || []).some((d) => d.getSourceFile().fileName.startsWith(SRC))) continue;
      const t = checker.getNonNullableType(checker.getTypeOfSymbol(p));
      const values = (t.isUnion() ? t.types : [t]).filter((x) => x.isStringLiteral()).map((x) => x.value);
      if (values.length < 2 || values.length > 12) continue;
      options.set(p.name, [...new Set([...(options.get(p.name) || []), ...values])]);
    }
  }
  if (!options.size) continue;
  const fallback = defaults(folder, options);
  const missing = [];
  const fixed = [];
  for (const [p, values] of options) {
    for (const v of values) {
      const key = `${name}.${p}=${v}`;
      const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ok = fallback.has(`${p}=${v}`) || new RegExp(`(['"\`])${esc}\\1`).test(text);
      if (GAPS[key]) { shown.add(key); if (ok) fixed.push(`${p}=${v}`); continue; }
      if (!ok) missing.push(`${p}="${v}"`);
    }
  }
  R.push({ name: `${name}: every value of its option props shows in a story or test`, ok: !missing.length && !fixed.length,
    detail: [missing.length && `not in any story or test: ${missing.join(', ')}. Add a story that renders it, or a test that sets it`,
      fixed.length && `known gap now shown, remove it from GAPS in prop-values.mjs: ${fixed.join(', ')}`].filter(Boolean).join('; ') });
}
const stale = Object.keys(GAPS).filter((k) => !shown.has(k));
R.push({ name: 'every GAPS entry names a value of a current option prop', ok: !stale.length, detail: `remove from GAPS in prop-values.mjs: ${stale.join(', ')}` });

done(report('Prop values', R));
