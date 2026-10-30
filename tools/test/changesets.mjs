// Changesets the release can read: tools/changesets.mjs, which both the pull request check (changeset-check.mjs) and
// the release (version.mjs) use, reads each kind of changeset right, and every pending .changeset/*.md parses, so a
// changeset that names the package wrong or lost its front matter fails here rather than on main in the release.
//   node tools/test/changesets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, read, report, done } from './lib.mjs';
import { parseChangeset } from '../changesets.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const name = 'serupa-ds';
const cases = [
  ['double quotes', '---\n"serupa-ds": minor\n---\n\n- Added: x.\n', 'minor'],
  ['single quotes', "---\n'serupa-ds': major\n---\n\n- Changed: x.\n", 'major'],
  ['no quotes', '---\nserupa-ds: patch\n---\n\n- Fixed: x.\n', 'patch'],
  ['Windows line ends', '---\r\n"serupa-ds": minor\r\n---\r\n\r\n- Added: x.\r\n', 'minor'],
];
for (const [label, text, want] of cases) {
  const got = parseChangeset(text, name);
  t(`reads a ${want} bump (${label})`, got.bump === want && got.body.includes('x.'), JSON.stringify(got));
}
const bad = [
  ['no front matter', '- Fixed: x.\n', 'front matter'],
  ['another package', '---\n"serupa": minor\n---\n\n- Added: x.\n', 'no bump'],
  ['a longer name that starts the same', '---\n"serupa-ds-extra": minor\n---\n\n- Added: x.\n', 'no bump'],
  ['an unknown bump', '---\n"serupa-ds": huge\n---\n\n- Added: x.\n', 'no bump'],
];
for (const [label, text, word] of bad) {
  const got = parseChangeset(text, name);
  t(`refuses a changeset with ${label}`, got.error?.includes(word), JSON.stringify(got));
}
// The name is matched as text: a dot in a future scoped name doesn't stand for any character.
t('matches a scoped name literally', parseChangeset('---\n"@diki/serupa.ds": minor\n---\n', '@diki/serupa.ds').bump === 'minor'
  && !!parseChangeset('---\n"@diki/serupaXds": minor\n---\n', '@diki/serupa.ds').error, 'escape the name');

const dir = path.join(PROJECT, '.changeset');
const pkg = JSON.parse(read('package.json')).name;
const pending = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md') : [];
const unreadable = pending.map((f) => [f, parseChangeset(fs.readFileSync(path.join(dir, f), 'utf8'), pkg).error]).filter(([, e]) => e);
t(`every pending changeset has a bump for ${pkg} (${pending.length})`, !unreadable.length, unreadable.map(([f, e]) => `.changeset/${f}: ${e}`).join('; '));

done(report('Changesets', R));
