// Every component's README shows its token table exactly as tools/tokens/readme-tables.mjs makes it from its
// <name>.tokens.json, so the docs list every token the package publishes, with the published default and
// description (E14). Fix a failure with npm run tokens; change a description in the tokens.json, not the README.
//   node tools/test/token-tables.mjs
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';
import { cell, components, render, tableFor } from '../tokens/readme-tables.mjs';

const R = [];
for (const c of components()) {
  const r = render(c);
  const name = `${c.name}: its README's token table matches ${path.basename(c.tokens)}`;
  if (r.error) R.push({ name, ok: false, detail: r.error });
  else R.push({ name, ok: r.text === r.old, detail: `${path.relative(PROJECT, c.readme)} is out of date: run npm run tokens` });
}
// The table itself: one row per token, the shared token as the default, and a heading per group on a long one.
const button = components().find((c) => c.name === 'Button');
const t = button ? tableFor(button.tokens) : '';
R.push({ name: 'a long table gets a heading per group, and a reference reads as the shared token\'s name', ok: /^\*\*Colors\*\*$/m.test(t) && t.includes('| `--button-gap-md` | `spacing-1.5` |') && t.includes('| `--button-ghost-bg` | `transparent` |'), detail: t.slice(0, 300) });
// A description's backslashes and pipes show as typed: every one, not only the first, outside code and in it.
const cases = [
  ['a | b | c', 'a \\| b \\| c'],
  ['C:\\x \\ y', 'C:\\\\x \\\\ y'],
  ['\\|', '\\\\\\|'],
  ['set `var(--spacing-0\\.5)` or `a|b`', 'set `var(--spacing-0\\.5)` or `a\\|b`'],
  ['two\nlines', 'two lines'],
];
const wrong = cases.filter(([s, want]) => cell(s) !== want);
R.push({ name: 'a cell escapes every backslash and pipe in prose, and only pipes in code', ok: !wrong.length, detail: wrong.map(([s, want]) => `${JSON.stringify(s)} gave ${JSON.stringify(cell(s))}, not ${JSON.stringify(want)}`).join('; ') });

done(report('Token tables', R));
