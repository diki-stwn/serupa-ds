// A story for every state (X1): each component whose Props take a state as a boolean (disabled, invalid, error,
// loading, checked, selected, readOnly) has a story that sets it, so its visual baselines in every theme and the
// Storybook axe pass cover that state too, not only the default look. A story sets it in its args (disabled: true)
// or in its JSX (<Select disabled …>); disabled: false or disabled={false} doesn't count. What has no story yet is in KNOWN, which only shrinks: an entry that gets its
// story fails until it's taken out.
//   node tools/test/state-stories.mjs
import fs from 'node:fs';
import path from 'node:path';
// TypeScript 7 has no compiler API yet, so this reads the types with TypeScript 6's (see tools/typescript/api.mjs).
import ts from '@typescript/typescript6';
import { PROJECT, done, report } from './lib.mjs';

const STATES = ['disabled', 'invalid', 'error', 'loading', 'checked', 'selected', 'readOnly'];
// A field shows invalid when its Field has an error, so error="…" on the Field covers it.
const ALSO = { invalid: ['error'] };
// States every story shows without setting them, with why.
const SHOWN = {
  'Loader.loading': 'on by default: every story shows a Loader loading',
  'Radio.checked': "the group's value checks one Radio: the stories set it on RadioGroup",
};
// No story yet, each to get one in its own pull request (X1, with the "update-visual-baselines" label).
const KNOWN = {
  ColorPicker: ['disabled', 'invalid'],
  PinInput: ['readOnly'],
};

const config = ts.getParsedCommandLineOfConfigFile(path.join(PROJECT, 'tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const DIR = path.join(PROJECT, 'src', 'components');
const real = (s) => (s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s);
const tagged = (p) => (p.declarations || []).some((d) => ts.getJSDocTags(d).some((t) => ['internal', 'deprecated'].includes(t.tagName.text)));

const missing = {};
let checked = 0;
for (const name of fs.readdirSync(DIR).sort()) {
  const index = program.getSourceFile(path.join(DIR, name, 'index.ts'));
  const stories = path.join(DIR, name, `${name}.stories.tsx`);
  if (!index || !fs.existsSync(stories)) continue;
  const props = checker.getExportsOfModule(checker.getSymbolAtLocation(index)).map(real).find((s) => s.name === `${name}Props`);
  if (!props) continue;
  checked++;
  const text = fs.readFileSync(stories, 'utf8');
  const source = fs.readdirSync(path.join(DIR, name)).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx$/.test(f)).map((f) => fs.readFileSync(path.join(DIR, name, f), 'utf8')).join('\n');
  const type = checker.getDeclaredTypeOfSymbol(props);
  for (const state of STATES) {
    const p = type.getProperty(state);
    if (!p || tagged(p)) continue;
    const t = checker.getNonNullableType(checker.getTypeOfSymbol(p));
    const boolean = (t.isUnion() ? t.types : [t]).some((x) => x.flags & ts.TypeFlags.BooleanLiteral);
    // A state it declares itself, or one it inherits from the element's attributes and reads (Select's disabled),
    // not every attribute an <input> takes (an Input's checked).
    const own = (p.declarations || []).some((d) => d.getSourceFile().fileName.startsWith(DIR));
    if (!boolean || (!own && !new RegExp(String.raw`\b${state}\b`).test(source))) continue;
    if (SHOWN[`${name}.${state}`]) continue;
    const set = [state, ...(ALSO[state] || [])].some((x) => new RegExp(String.raw`\b${x}(?:\s*[:=]\s*(?![\s{]*false\b)|(?=[\s/>]))`).test(text));
    if (!set) (missing[name] ||= []).push(state);
  }
}

const R = [];
const gaps = Object.entries(missing).filter(([c, s]) => s.some((x) => !(KNOWN[c] || []).includes(x)));
R.push({ name: `each of ${checked} components has a story for every state its Props take (${STATES.join(', ')})`, ok: !gaps.length, detail: gaps.map(([c, s]) => `${c}: ${s.filter((x) => !(KNOWN[c] || []).includes(x)).join(', ')}`).join('; ') + ' (add a story that sets it, or a KNOWN line with the queue item that will)' });
const done_ = Object.entries(KNOWN).flatMap(([c, s]) => s.filter((x) => !(missing[c] || []).includes(x)).map((x) => `${c} ${x}`));
R.push({ name: 'KNOWN lists only states that still have no story', ok: !done_.length, detail: `take these out of KNOWN: ${done_.join(', ')}` });

done(report('State stories', R));
