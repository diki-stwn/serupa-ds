// npm run version-packages: turns the pending changesets (.changeset/*.md) into the next version. The
// Release workflow runs it on main and opens a pull request with the result.
//   1. Each changeset's lines go under "## [Unreleased]" in CHANGELOG.md, in its Keep a Changelog
//      sections (Added, Changed, Deprecated, Removed, Fixed, Security), with what's already there.
//   2. The changesets are deleted, and tools/release.mjs makes the release: the biggest bump among them
//      (major, minor or patch), the notes under the new version, and the version in every file.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseChangeset } from './changesets.mjs';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIR = path.join(P, '.changeset');
const { name } = JSON.parse(fs.readFileSync(path.join(P, 'package.json'), 'utf8'));
const SECTIONS = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
const DEFAULT = { major: 'Changed', minor: 'Added', patch: 'Fixed' };
const RANK = { patch: 1, minor: 2, major: 3 };

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
if (!files.length) { console.log('No changesets: nothing to release.'); process.exit(0); }

let bump = 'patch';
const notes = Object.fromEntries(SECTIONS.map((s) => [s, []]));
for (const f of files) {
  const { bump: kind, body: raw, error } = parseChangeset(fs.readFileSync(path.join(DIR, f), 'utf8'), name);
  if (error) throw new Error(`.changeset/${f}: ${error}`);
  if (RANK[kind] > RANK[bump]) bump = kind;
  // Each "- " line is one entry (its indented lines go with it); text with no bullets is one entry.
  const body = raw.trim();
  const entries = /^- /m.test(body) ? body.split(/\n(?=- )/).map((e) => e.replace(/^- /, '')) : [body.replace(/\n+/g, ' ')];
  for (const e of entries) {
    // "Fixed: …", or with a scope, "Fixed (Combobox): …", which files under Fixed as "Combobox: …".
    const s = /^(Added|Changed|Deprecated|Removed|Fixed|Security)(?:\s*\(([^)]+)\))?:\s*/.exec(e);
    const text = s ? (s[2] ? `${s[2]}: ` : '') + e.slice(s[0].length) : e;
    notes[s ? s[1] : DEFAULT[kind]].push(text.charAt(0).toUpperCase() + text.slice(1));
  }
}

// Merge into Unreleased, keeping what's there and the section order.
const logPath = path.join(P, 'CHANGELOG.md');
const log = fs.readFileSync(logPath, 'utf8');
const u = /^## \[Unreleased\]\n([\s\S]*?)(?=^## )/m.exec(log);
if (!u) throw new Error('CHANGELOG.md: no "## [Unreleased]" section');
const have = Object.fromEntries(SECTIONS.map((s) => [s, []]));
let current = null;
for (const line of u[1].split('\n')) {
  const h = /^### (\w+)/.exec(line);
  if (h) { current = SECTIONS.includes(h[1]) ? h[1] : (have[h[1]] = have[h[1]] || [], h[1]); continue; }
  if (current && line.trim()) {
    if (/^- /.test(line)) have[current].push(line.slice(2)); else have[current][have[current].length - 1] += '\n' + line;
  }
}
const order = [...SECTIONS, ...Object.keys(have).filter((s) => !SECTIONS.includes(s))];
const merged = order.map((s) => /** @type {[string, string[]]} */ ([s, [...(have[s] || []), ...(notes[s] || [])]])).filter(([, list]) => list.length)
  .map(([s, list]) => `### ${s}\n\n${list.map((x) => '- ' + x).join('\n')}`).join('\n\n');
fs.writeFileSync(logPath, log.slice(0, u.index) + `## [Unreleased]\n\n${merged}\n\n` + log.slice(u.index + u[0].length));
for (const f of files) fs.rmSync(path.join(DIR, f));

execFileSync(process.execPath, [path.join(P, 'tools', 'release.mjs'), bump], { stdio: 'inherit' });
execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: P, stdio: 'inherit' });
