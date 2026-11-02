// What a pull request does to the test baselines, as one comment (K9): the Update baselines workflow posts it after
// it commits new pictures, so a reviewer sees each changed picture beside the old one, and each component's size
// change, without opening Files changed and paging through PNGs. It reads only git, so it runs anywhere.
//   node tools/baseline-report.mjs <base ref> [<head ref>]   prints the comment's Markdown
// GITHUB_REPOSITORY (owner/name) makes the picture links; without it they come from package.json's repository.
// The first line is a marker the workflow looks for, to edit its earlier comment instead of adding another.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MARKER = '<!-- serupa-baseline-report -->';
const VISUAL = 'tools/test/baseline-visual/';
const SIZE = 'tools/test/baseline-size/';
const SHOWN = 6;   // pictures shown per component; the rest are counted
// The other baselines, by folder or file, and what each one holds.
const OTHERS = [
  ['tools/test/baseline-aria/', 'roles and names'],
  ['tools/test/baseline-server/', 'server HTML'],
  ['tools/test/baseline-api/', 'public API'],
  ['tools/test/baseline-utilities.json', 'utility classes'],
  ['tools/test/baseline-class-queries.json', 'class queries in tests'],
  ['tools/test/baseline-package.txt', 'package files'],
];

const kib = (n) => (n == null ? '–' : `${n} KiB`);
const delta = (a, b) => {
  if (a == null || b == null) return '';
  const d = Math.round((b - a) * 10) / 10;
  return d === 0 ? '±0' : `${d > 0 ? '+' : ''}${d}`;
};

/**
 * The comment's Markdown.
 * @param {{ status: string, file: string }[]} changes  git's name-status lines: A, M or D and the path
 * @param {(file: string) => any} before  a size baseline's JSON at the base, or null
 * @param {(file: string) => any} after   the same at the head, or null
 * @param {(file: string, side: 'base' | 'head') => string} url  a picture's address
 */
export function report(changes, before, after, url) {
  const parts = [MARKER, '## Baselines in this pull request', ''];
  const visual = changes.filter((c) => c.file.startsWith(VISUAL) && c.file.endsWith('.png'));
  const sizes = changes.filter((c) => c.file.startsWith(SIZE) && c.file.endsWith('.json'));
  if (!visual.length && !sizes.length && !OTHERS.some(([p]) => changes.some((c) => c.file.startsWith(p)))) {
    return [...parts, 'No baseline changes.'].join('\n');
  }

  if (visual.length) {
    const byComponent = new Map();
    for (const c of visual) {
      const name = c.file.slice(VISUAL.length).split('/')[0];
      byComponent.set(name, [...(byComponent.get(name) || []), c]);
    }
    const count = (s) => visual.filter((c) => c.status === s).length;
    parts.push(`### Pictures: ${count('M')} changed, ${count('A')} new, ${count('D')} removed`, '');
    for (const [name, list] of [...byComponent].sort(([a], [b]) => a.localeCompare(b))) {
      const n = (s) => list.filter((c) => c.status === s).length;
      const summary = [['M', 'changed'], ['A', 'new'], ['D', 'removed']].filter(([s]) => n(s)).map(([s, w]) => `${n(s)} ${w}`).join(', ');
      parts.push(`<details><summary><b>${name}</b>: ${summary}</summary>`, '', '| Picture | Before | After |', '| --- | --- | --- |');
      for (const c of list.slice(0, SHOWN)) {
        const label = path.basename(c.file, '.png');
        const old = c.status === 'A' ? 'new' : `<img src="${url(c.file, 'base')}" width="240" alt="${label} before">`;
        const now = c.status === 'D' ? 'removed' : `<img src="${url(c.file, 'head')}" width="240" alt="${label} after">`;
        parts.push(`| \`${label}\` | ${old} | ${now} |`);
      }
      if (list.length > SHOWN) parts.push('', `And ${list.length - SHOWN} more in Files changed.`);
      parts.push('', '</details>', '');
    }
  }

  if (sizes.length) {
    parts.push('### Size (gzipped)', '', '| Component | Alone | Share of the bundle | CSS |', '| --- | --- | --- | --- |');
    for (const c of [...sizes].sort((a, b) => a.file.localeCompare(b.file))) {
      const a = c.status === 'A' ? null : before(c.file);
      const b = c.status === 'D' ? null : after(c.file);
      const cell = (k) => (a?.[k] === b?.[k] ? kib(b?.[k]) : `${kib(a?.[k])} → ${kib(b?.[k])} (${delta(a?.[k], b?.[k])})`.replace(' ()', ''));
      parts.push(`| ${path.basename(c.file, '.json')} | ${cell('alone')} | ${cell('share')} | ${cell('css')} |`);
    }
    parts.push('');
  }

  const others = OTHERS.map(([p, what]) => [what, changes.filter((c) => c.file.startsWith(p)).length]).filter(([, n]) => n);
  if (others.length) {
    parts.push('### Other baselines', '', ...others.map(([what, n]) => `- ${what}: ${n} file${n === 1 ? '' : 's'}`), '');
  }
  parts.push('Each one moved on purpose: say why in the pull request (AGENTS.md, "Baselines move only on purpose").');
  return parts.join('\n');
}

function main(base, head = 'HEAD') {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const from = git('merge-base', base, head).trim();
  const to = git('rev-parse', head).trim();
  const changes = git('diff', '--no-renames', '--name-status', from, to, '--', 'tools/test/')
    .split('\n').filter(Boolean).map((l) => { const [status, file] = l.split('\t'); return { status: status[0], file }; })
    .filter((c) => c.file.includes('/baseline-') || path.basename(c.file).startsWith('baseline-'));
  const show = (rev) => (file) => { try { return JSON.parse(git('show', `${rev}:${file}`)); } catch { return null; } };
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY || pkg.repository.url.replace(/^git\+https:\/\/github\.com\//, '').replace(/\.git$/, '');
  const url = (file, side) => `https://github.com/${repo}/raw/${side === 'base' ? from : to}/${file}`;
  process.stdout.write(report(changes, show(from), show(to), url) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: node tools/baseline-report.mjs <base ref> [<head ref>]'); process.exit(2); }
  main(process.argv[2], process.argv[3]);
}
