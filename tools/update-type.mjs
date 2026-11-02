// How big is a dependency update (D15): the Dependabot workflow merges a green pull request on its own when every
// version it moves is a patch or a minor, and leaves a major (or anything else) for a person. It reads the versions
// itself, from git, instead of trusting the pull request's title or an outside action.
//   node tools/update-type.mjs <base ref> [<head ref>]   prints patch, minor, major or none
// It compares package.json (every dependency section) and the version comments on pinned actions in .github/
// ("uses: owner/name@<sha> # v1.2.3"). A 0.x version's minor is a major, as semver says. A dependency added or
// removed, a version that isn't plain x.y.z (a range, a tag, an alias, a prerelease), a pinned action without a
// version comment, and a change to any other file make it "other": a person looks at those.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RANK = { none: 0, patch: 1, minor: 2, major: 3, other: 4 };
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
// Files an update may touch besides package.json and the workflows.
const ALSO = ['package-lock.json'];
const larger = (a, b) => (RANK[b] > RANK[a] ? b : a);

/** One version move: patch, minor, major, none, or other when either side isn't plain x.y.z. */
export function bump(from, to) {
  const parse = (v) => (/^\d+\.\d+\.\d+$/.test(v ?? '') ? v.split('.').map(Number) : null);
  const a = parse(from);
  const b = parse(to);
  if (!a || !b) return 'other';
  if (a.every((n, i) => n === b[i])) return 'none';
  // Going back down is never a plain update.
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) { if (b[i] < a[i]) return 'other'; break; }
  if (a[0] !== b[0]) return 'major';
  if (a[1] !== b[1]) return a[0] === 0 ? 'major' : 'minor';
  return a[0] === 0 && a[1] === 0 ? 'major' : 'patch';
}

/** package.json at both sides: the largest move, and each one. */
export function packageChanges(before, after) {
  const moves = [];
  for (const s of SECTIONS) {
    const a = before?.[s] ?? {};
    const b = after?.[s] ?? {};
    for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[name] === b[name]) continue;
      moves.push({ name, from: a[name] ?? null, to: b[name] ?? null, type: name in a && name in b ? bump(a[name], b[name]) : 'other' });
    }
  }
  // Anything else in package.json (a script, the version, a field) is not an update.
  const rest = (p) => JSON.stringify(Object.fromEntries(Object.entries(p ?? {}).filter(([k]) => !SECTIONS.includes(k))));
  if (rest(before) !== rest(after)) moves.push({ name: 'package.json', from: null, to: null, type: 'other' });
  return moves;
}

/** A workflow or action file at both sides: each pinned action whose version comment moved. */
export function actionChanges(before, after) {
  const pins = (text) => {
    const found = new Map();
    for (const m of (text ?? '').matchAll(/uses:\s*([\w.-]+\/[\w./-]+)@(\S+)(?:\s*#\s*v?(\S+))?/g)) {
      found.set(m[1], [...(found.get(m[1]) ?? []), { ref: m[2], version: m[3] ?? null }]);
    }
    return found;
  };
  const a = pins(before);
  const b = pins(after);
  const moves = [];
  for (const name of new Set([...a.keys(), ...b.keys()])) {
    const was = a.get(name) ?? [];
    const now = b.get(name) ?? [];
    if (JSON.stringify(was) === JSON.stringify(now)) continue;
    const versions = (list) => [...new Set(list.map((p) => p.version))];
    const [from] = versions(was);
    const [to] = versions(now);
    // The same action at two versions, a new one, or one that went away: a person looks.
    const plain = was.length === now.length && versions(was).length === 1 && versions(now).length === 1;
    // A new commit under the same version comment says nothing about its size.
    const type = plain ? bump(from, to) : 'other';
    moves.push({ name, from: from ?? null, to: to ?? null, type: type === 'none' ? 'other' : type });
  }
  // A line that changed without a pin moving is not an update.
  const strip = (t) => (t ?? '').replace(/uses:\s*[\w.-]+\/[\w./-]+@\S+(?:\s*#\s*\S+)?/g, 'uses:');
  if (strip(before) !== strip(after)) moves.push({ name: 'workflow', from: null, to: null, type: 'other' });
  return moves;
}

/**
 * The update's size from the files it changes.
 * @param {string[]} files  the paths that differ
 * @param {(file: string, side: 'base' | 'head') => string | null} read  a file's text at one side, or null
 */
export function updateType(files, read) {
  const moves = [];
  for (const f of files) {
    if (f === 'package.json') {
      const json = (side) => { const t = read(f, side); return t == null ? null : JSON.parse(t); };
      moves.push(...packageChanges(json('base'), json('head')));
    } else if (/^\.github\/(workflows\/[^/]+|actions\/[^/]+\/action)\.ya?ml$/.test(f)) {
      moves.push(...actionChanges(read(f, 'base'), read(f, 'head')));
    } else if (!ALSO.includes(f)) {
      moves.push({ name: f, from: null, to: null, type: 'other' });
    }
  }
  return { type: moves.map((m) => m.type).reduce(larger, 'none'), moves };
}

function main(base, head = 'HEAD') {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const from = git('merge-base', base, head).trim();
  const to = git('rev-parse', head).trim();
  const files = git('diff', '--no-renames', '--name-only', from, to).split('\n').filter(Boolean);
  const read = (file, side) => { try { return git('show', `${side === 'base' ? from : to}:${file}`); } catch { return null; } };
  const { type, moves } = updateType(files, read);
  for (const m of moves) console.error(`${m.type.padEnd(5)}  ${m.name}${m.from || m.to ? ` ${m.from ?? '(none)'} → ${m.to ?? '(none)'}` : ''}`);
  console.log(type);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: node tools/update-type.mjs <base ref> [<head ref>]'); process.exit(2); }
  main(process.argv[2], process.argv[3]);
}
