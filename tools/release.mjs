// Release a new version: moves the changelog's Unreleased notes under the new version and stamps the
// version into every file that names it.
//
// usage:  node tools/release.mjs 1.1.0            (or: major | minor | patch)
//         node tools/release.mjs --check          only check that every file carries the same version
//
// Then run the tests (node tools/test/run.mjs) and publish. Choosing the number (README, Versioning):
//   major  something that worked stops working: a token, class, prop or file removed or renamed, or a
//          default changed in a way that changes existing screens
//   minor  something new, everything existing keeps working: new tokens, classes, components, props
//   patch  fixes that don't change what correct code gets
import fs from 'node:fs';
import path from 'node:path';
import { stampReadme } from './build/registry.mjs';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const V = '(\\d+\\.\\d+\\.\\d+)';
// file -> patterns whose group 1 is the version. The built files (dist/, with base.css and theme.js, which say
// __VERSION__ in src/) take it from package.json at build time.
const STAMPS = {
  'package.json': [`"version": "${V}"`],
  // the install instructions pin the latest tag (and its release file)
  'README.md': [`serupa-ds#v${V}`, `\\(\`#v${V}\`\\)`, `releases/download/v${V}/`, `/serupa-ds-${V}\\.tgz`],
  'docs/GettingStarted.mdx': [`serupa-ds#v${V}`],
  'skills/serupa/SKILL.md': [`serupa-ds#v${V}`],
};

const read = (f) => fs.readFileSync(path.join(P, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(P, f), s);

function versions() {
  const out = {};
  for (const [f, pats] of Object.entries(STAMPS)) {
    for (const pat of pats) {
      const found = [...read(f).matchAll(new RegExp(pat, 'g'))].map((m) => m[1]);
      for (const v of found.length ? found : ['(missing)']) (out[f] ||= new Set()).add(v);
    }
  }
  const log = /^## \[(\d+\.\d+\.\d+)\]/m.exec(read('CHANGELOG.md'));
  out['CHANGELOG.md (latest release)'] = new Set([log ? log[1] : '(missing)']);
  return out;
}

function check() {
  const v = versions();
  const found = new Set(Object.values(v).flatMap((s) => [...s]));
  if (found.size === 1) { console.log('All files carry version', [...found][0]); return true; }
  for (const [f, s] of Object.entries(v)) console.log(`${f}: ${[...s].sort().join(', ')}`);
  return false;
}

const arg = process.argv[2];
if (!arg) { console.error('usage: node tools/release.mjs <major | minor | patch | x.y.z | --check>'); process.exit(2); }
if (arg === '--check') process.exit(check() ? 0 : 1);

const cur = JSON.parse(read('package.json')).version;
const [ma, mi, pa] = cur.split('.').map(Number);
const next = { major: `${ma + 1}.0.0`, minor: `${ma}.${mi + 1}.0`, patch: `${ma}.${mi}.${pa + 1}` }[arg] || arg;
const higher = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };
if (!/^\d+\.\d+\.\d+$/.test(next) || !higher(next.split('.').map(Number), [ma, mi, pa])) {
  console.error(`The new version must be higher than ${cur}: got ${next}`); process.exit(1);
}
const log = read('CHANGELOG.md');
const m = /^## \[Unreleased\]\n([\s\S]*?)(?=^## \[)/m.exec(log);
if (!m || !m[1].trim()) { console.error('Write the changes under "## [Unreleased]" in CHANGELOG.md first.'); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
write('CHANGELOG.md', log.slice(0, m.index) + `## [Unreleased]\n\n## [${next}] - ${today}\n\n${m[1].trim()}\n\n` + log.slice(m.index + m[0].length));
for (const [f, pats] of Object.entries(STAMPS)) {
  let s = read(f);
  for (const pat of pats) s = s.replace(new RegExp(pat, 'g'), (x, v) => x.replace(v, next));
  write(f, s);
}
stampReadme(P);   // README.md's components index, from the component folders as released
check();
console.log(`Released ${next} (${cur} before). Run the tests, then publish.`);
