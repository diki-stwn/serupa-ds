// CHANGELOG.md's link definitions, as Keep a Changelog ends the file: each "## [x.y.z]" heading links to the
// changes since the version before it (a compare between their tags), the oldest to its own tag, and
// "## [Unreleased]" to everything since the latest. Versions that were never tagged (most before the 5.0.0 rename)
// are headings without brackets, so they don't ask for a link. tools/release.mjs writes the block on every release
// and its --check fails when the block isn't what the headings give.
import fs from 'node:fs';
import path from 'node:path';

const DEF = /^\[[^\]\n]+\]: \S+$/;

/** @param {string} root the repository; its package.json's repository URL is where the links go */
export function repoUrl(root) {
  const { repository } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return String(typeof repository === 'string' ? repository : repository.url).replace(/^git\+/, '').replace(/\.git$/, '');
}

/** The file with its link definitions written from its headings, replacing the ones at its end.
 * @param {string} log CHANGELOG.md's text @param {string} repo https://github.com/owner/name */
export function withLinks(log, repo) {
  const lines = log.replace(/\s+$/, '').split('\n');
  while (lines.length && (DEF.test(lines[lines.length - 1]) || !lines[lines.length - 1].trim())) lines.pop();
  const names = [...log.matchAll(/^## \[([^\]]+)\]/gm)].map((m) => m[1]);
  const versions = names.filter((n) => n !== 'Unreleased');
  const defs = names.map((n) => {
    const at = versions.indexOf(n);
    if (n === 'Unreleased') return `[${n}]: ${repo}/compare/v${versions[0]}...HEAD`;
    return `[${n}]: ${repo}/${at + 1 < versions.length ? `compare/v${versions[at + 1]}...v${n}` : `releases/tag/v${n}`}`;
  });
  return `${lines.join('\n')}\n\n${defs.join('\n')}\n`;
}
