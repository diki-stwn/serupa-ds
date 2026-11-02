// Every component's README shows its token table exactly as tools/tokens/readme-tables.mjs makes it from its
// <name>.tokens.json, so the docs list every token the package publishes, with the published default and
// description (E14). Fix a failure with npm run tokens; change a description in the tokens.json, not the README.
//   node tools/test/token-tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';
import { cell, components, render, tableFor } from '../tokens/readme-tables.mjs';
import * as badge from '../tokens/badge-palette.mjs';

const R = [];
for (const c of components()) {
  const r = render(c);
  const name = `${c.name}: its README's token table matches ${path.basename(c.tokens)}`;
  if (r.error) R.push({ name, ok: false, detail: r.error });
  else R.push({ name, ok: r.text === r.old, detail: `${path.relative(PROJECT, c.readme)} is out of date: run npm run tokens` });
}
// Badge's palette tones are made from tokens.json too (F15): every chromatic family, its light solid step by contrast.
const b = badge.render();
R.push({ name: "Badge.css: its palette tones match tokens.json", ok: !b.error && b.text === b.old, detail: b.error || 'src/components/Badge/Badge.css is out of date: run npm run tokens' });
const fams = (() => { try { return badge.families(JSON.parse(fs.readFileSync(path.join(PROJECT, 'tokens.json'), 'utf8'))); } catch (e) { return String(e); } })();
R.push({ name: 'Badge: 17 chromatic families, no grays, white on the light solid fill', ok: Array.isArray(fams) && fams.length === 17 && !fams.some((f) => /gray|slate|zinc|neutral|stone/.test(f.name)) && fams.find((f) => f.name === 'red')?.solid === 600 && fams.find((f) => f.name === 'amber')?.solid === 700, detail: JSON.stringify(fams) });
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
