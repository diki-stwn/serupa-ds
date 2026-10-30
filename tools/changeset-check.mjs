// Does this pull request need a changeset, and has it got one? The Changeset workflow runs it on every pull request.
//   node tools/changeset-check.mjs <base commit>
// A change to what a project installs (the components, styles, tokens, fonts, the CLI, the build that makes dist/)
// needs a .changeset/*.md file; tests, stories, docs and the rest of tools/ don't. Fails listing the files, and
// says how to add one, or to label the pull request "no-changeset" when the change really ships nothing new.
// The public API decides the smallest bump (E11): a change to tools/test/baseline-api/ (the exported types, which
// api.mjs keeps) is never a patch, and an export that goes away is a major. So a changeset that says patch for a
// new prop, or minor for a removed component, fails here rather than in the release. Tokens and utility classes are
// public API too (README, Versioning): a token in tokens.json or a class in tools/test/baseline-utilities.json that
// goes away is a major, and a new one at least a minor.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseChangeset } from './changesets.mjs';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = process.argv[2];
if (!base) { console.error('Usage: node tools/changeset-check.mjs <base commit>'); process.exit(2); }

// What ships: everything a release builds from or puts in the package.
const SHIPS = [/^src\//, /^bin\//, /^fonts\//, /^design-tokens\//, /^tokens\.(json|css)$/, /^tsup\.config\.mjs$/, /^tools\/(build|utilities|icons)\//];
// Inside those, what doesn't reach a project: tests, stories, docs pages and usage guides.
const ASIDE = [/\.test\.tsx?$/, /\.stories\.tsx$/, /\.mdx$/, /\.md$/, /^src\/components\/[^/]+\/preview\.html$/];

const changed = execFileSync('git', ['diff', '--name-status', '--no-renames', `${base}...HEAD`], { cwd: P, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
const shipping = changed.map(([, f]) => f).filter((f) => SHIPS.some((r) => r.test(f)) && !ASIDE.some((r) => r.test(f)));
const changesets = changed.filter(([s, f]) => s !== 'D' && /^\.changeset\/[^/]+\.md$/.test(f) && f !== '.changeset/README.md').map(([, f]) => f);

if (!shipping.length) { console.log('No change to what the package ships: no changeset needed.'); process.exit(0); }
if (changesets.length) {
  const RANK = { patch: 1, minor: 2, major: 3 };
  const { name } = JSON.parse(fs.readFileSync(path.join(P, 'package.json'), 'utf8'));
  // A changeset the release can't read (no front matter, or no bump for this package) fails here: counted as a patch,
  // it would pass and then stop the Release workflow on main.
  const read = changesets.map((f) => ({ f, ...parseChangeset(fs.readFileSync(path.join(P, f), 'utf8'), name) }));
  const bad = read.filter((c) => c.error);
  if (bad.length) {
    console.log(`The release can't read ${bad.length > 1 ? 'these changesets' : 'this changeset'}:\n${bad.map((c) => `  ${c.f}: ${c.error}`).join('\n')}`);
    console.log('\nSee .changeset/README.md for the format.');
    process.exit(1);
  }
  const bump = read.map((c) => c.bump).reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'patch');
  // What the exported types lose and gain, from the API baseline (one .d.ts per component, its first line the export list).
  const api = changed.filter(([, f]) => /^tools\/test\/baseline-api\/[^/]+\.d\.ts$/.test(f));
  // A file at a commit, or null when the commit doesn't have it (a new component, a token file not yet there). Any other
  // failure, such as a base commit that isn't fetched, stops the check instead of reading as "no exports, no tokens".
  const show = (ref, f) => {
    const exists = execFileSync('git', ['ls-tree', '--name-only', ref, '--', f], { cwd: P, encoding: 'utf8' }).trim() !== '';
    return exists ? execFileSync('git', ['show', `${ref}:${f}`], { cwd: P, encoding: 'utf8', maxBuffer: 64 << 20 }) : null;
  };
  const exportsOf = (ref, f) => (/^\/\/ exports: (.*)$/m.exec(show(ref, f) ?? '') || [])[1]?.split(', ') ?? [];
  const gone = api.flatMap(([, f]) => { const now = exportsOf('HEAD', f); return exportsOf(base, f).filter((e) => !now.includes(e)).map((e) => `${e} (${path.basename(f, '.d.ts')})`); });
  // Token names (with the font-* and text-* families the type scale makes) and utility class names at a commit.
  const json = (ref, f) => { const text = show(ref, f); return text == null ? null : JSON.parse(text); };
  const tokensAt = (ref) => {
    const t = json(ref, 'tokens.json');
    if (!t) return new Set();
    const names = Object.values(t).filter((g) => Array.isArray(g?.tokens)).flatMap((g) => g.tokens.map((x) => x.name));
    return new Set([...names, ...Object.keys(t.type?.families || {}).map((k) => 'font-' + k), ...(t.type?.groups || []).flatMap((g) => g.styles.map((x) => 'text-' + x.name))]);
  };
  const classesAt = (ref) => new Set(Object.keys(json(ref, 'tools/test/baseline-utilities.json') || {}));
  const diff = (was, now) => ({ gone: [...was].filter((n) => !now.has(n)), added: [...now].filter((n) => !was.has(n)) });
  const touched = (f) => changed.some(([, g]) => g === f);
  const tokens = touched('tokens.json') ? diff(tokensAt(base), tokensAt('HEAD')) : { gone: [], added: [] };
  const classes = touched('tools/test/baseline-utilities.json') ? diff(classesAt(base), classesAt('HEAD')) : { gone: [], added: [] };
  const few = (l) => l.slice(0, 8).join(', ') + (l.length > 8 ? ` and ${l.length - 8} more` : '');
  const needs = gone.length || tokens.gone.length || classes.gone.length ? 'major' : api.length || tokens.added.length || classes.added.length ? 'minor' : 'patch';
  if (RANK[bump] < RANK[needs]) {
    console.log(`The changeset says ${bump}, but the public API changed, which needs at least ${needs}:`);
    if (gone.length) console.log(`  exports removed: ${gone.join(', ')}`);
    else if (api.length) console.log(`  the exported types changed: ${api.map(([, f]) => path.basename(f, '.d.ts')).join(', ')} (tools/test/baseline-api/)`);
    if (tokens.gone.length) console.log(`  tokens removed or renamed: ${few(tokens.gone)}`);
    if (classes.gone.length) console.log(`  utility classes removed or renamed: ${few(classes.gone)}`);
    if (needs === 'minor' && tokens.added.length) console.log(`  new tokens: ${few(tokens.added)}`);
    if (needs === 'minor' && classes.added.length) console.log(`  new utility classes: ${few(classes.added)}`);
    console.log(`\nRaise the bump in ${changesets.join(', ')}. A removal is a major with a migration note (README, Versioning); new props,\ncomponents and type changes that keep existing code compiling are a minor.`);
    process.exit(1);
  }
  console.log(`Changeset: ${changesets.join(', ')} (${bump}, for ${shipping.length} shipped file${shipping.length > 1 ? 's' : ''}${needs !== 'patch' ? `; the API change needs at least ${needs}` : ''}).`);
  process.exit(0);
}
console.log(`These files change what a project installs, and the pull request has no changeset:\n${shipping.map((f) => '  ' + f).join('\n')}`);
console.log('\nAdd one with npx changeset (see .changeset/README.md). If the change really ships nothing new (a comment, a refactor\nwith identical output), label the pull request "no-changeset".');
process.exit(1);
