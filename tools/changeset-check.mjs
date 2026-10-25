// Does this pull request need a changeset, and has it got one? The Changeset workflow runs it on every pull request.
//   node tools/changeset-check.mjs <base commit>
// A change to what a project installs (the components, styles, tokens, fonts, the CLI, the build that makes dist/)
// needs a .changeset/*.md file; tests, stories, docs and the rest of tools/ don't. Fails listing the files, and
// says how to add one, or to label the pull request "no-changeset" when the change really ships nothing new.
// The public API decides the smallest bump (E11): a change to tools/test/baseline-api/ (the exported types, which
// api.mjs keeps) is never a patch, and an export that goes away is a major. So a changeset that says patch for a
// new prop, or minor for a removed component, fails here rather than in the release.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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
  const bumps = changesets.map((f) => (new RegExp(`["']?${name}["']?\\s*:\\s*(major|minor|patch)`).exec(fs.readFileSync(path.join(P, f), 'utf8')) || [])[1] || 'patch');
  const bump = bumps.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'patch');
  // What the exported types lose and gain, from the API baseline (one .d.ts per component, its first line the export list).
  const api = changed.filter(([, f]) => /^tools\/test\/baseline-api\/[^/]+\.d\.ts$/.test(f));
  const exportsOf = (ref, f) => { try { return (/^\/\/ exports: (.*)$/m.exec(execFileSync('git', ['show', `${ref}:${f}`], { cwd: P, encoding: 'utf8' })) || [])[1]?.split(', ') ?? []; } catch { return []; } };
  const gone = api.flatMap(([, f]) => { const now = exportsOf('HEAD', f); return exportsOf(base, f).filter((e) => !now.includes(e)).map((e) => `${e} (${path.basename(f, '.d.ts')})`); });
  const needs = gone.length ? 'major' : api.length ? 'minor' : 'patch';
  if (RANK[bump] < RANK[needs]) {
    console.log(`The changeset says ${bump}, but the public API changed, which needs at least ${needs}:`);
    if (gone.length) console.log(`  exports removed: ${gone.join(', ')}`);
    else console.log(`  the exported types changed: ${api.map(([, f]) => path.basename(f, '.d.ts')).join(', ')} (tools/test/baseline-api/)`);
    console.log(`\nRaise the bump in ${changesets.join(', ')}. A removal is a major with a migration note (README, Versioning); new props,\ncomponents and type changes that keep existing code compiling are a minor.`);
    process.exit(1);
  }
  console.log(`Changeset: ${changesets.join(', ')} (${bump}, for ${shipping.length} shipped file${shipping.length > 1 ? 's' : ''}${api.length ? `; the API change needs at least ${needs}` : ''}).`);
  process.exit(0);
}
console.log(`These files change what a project installs, and the pull request has no changeset:\n${shipping.map((f) => '  ' + f).join('\n')}`);
console.log('\nAdd one with npx changeset (see .changeset/README.md). If the change really ships nothing new (a comment, a refactor\nwith identical output), label the pull request "no-changeset".');
process.exit(1);
