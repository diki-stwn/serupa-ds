// After the nightly Cross-browser run: keeps one issue, "Nightly cross-browser failing", in step with it. A red run
// opens the issue (or updates the open one) with the failing tests per browser; a green run closes it. Without it a
// red night only wrote a job summary that nobody opens. The workflow's report job runs it on scheduled runs only.
//   node tools/nightly-issue.mjs <folder the run's artifacts were downloaded to> <components job result>
// GH_TOKEN must allow writing issues; GITHUB_REPOSITORY, GITHUB_SERVER_URL and GITHUB_RUN_ID come from Actions.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

export const TITLE = 'Nightly cross-browser failing';

// The failing tests in one run's output, without the ANSI colors and without repeats (the suite runs twice, once in
// a second locale, so a test can fail in both passes).
export function failures(text) {
  const plain = stripVTControlCharacters(text);
  const out = [];
  for (const m of plain.matchAll(/^\s*FAIL\s+\S+\s+\((\w+)\)\s+(\S+) > (.+)$/gm)) {
    const line = `${m[2]} > ${m[3].trim()}`;
    if (!out.includes(line)) out.push(line);
  }
  return out;
}

// The issue's text: each browser's failing tests, or a note when a browser's job failed before any test reported.
export function body(results, runUrl) {
  const parts = [`The nightly [Cross-browser run](${runUrl}) failed. Each browser's full output is attached to the run.`, ''];
  for (const [browser, tests] of Object.entries(results)) {
    parts.push(`### ${browser}`, '');
    if (tests === null) parts.push('No output: the job stopped before the tests ran (install or build), see the run.');
    else if (!tests.length) parts.push('No failing tests.');
    else parts.push(`${tests.length} failing:`, '', ...tests.slice(0, 100).map((t) => `- \`${t}\``), ...(tests.length > 100 ? [`- and ${tests.length - 100} more`] : []));
    parts.push('');
  }
  parts.push('This issue closes itself on the next green nightly run.');
  return parts.join('\n');
}

/** @param {string} dir @param {string} result */
function main(dir, result) {
  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: id } = process.env;
  const runUrl = `${server}/${repo}/actions/runs/${id}`;
  const open = JSON.parse(gh('issue', 'list', '--repo', repo, '--state', 'open', '--search', `"${TITLE}" in:title`, '--json', 'number,title'))
    .find((i) => i.title === TITLE);
  if (result === 'success') {
    if (open) gh('issue', 'close', String(open.number), '--repo', repo, '--comment', `Green again in [this run](${runUrl}).`);
    console.log(open ? `Closed #${open.number}.` : 'Green, and no issue is open.');
    return;
  }
  const results = {};
  for (const browser of ['firefox', 'webkit']) {
    const file = path.join(dir, `test-output-${browser}`, 'test-output.txt');
    results[browser] = fs.existsSync(file) ? failures(fs.readFileSync(file, 'utf8')) : null;
  }
  const notes = path.join(dir, 'issue.md');
  fs.writeFileSync(notes, body(results, runUrl));
  if (open) {
    gh('issue', 'edit', String(open.number), '--repo', repo, '--body-file', notes);
    gh('issue', 'comment', String(open.number), '--repo', repo, '--body', `Still failing in [this run](${runUrl}); the list above is from it.`);
    console.log(`Updated #${open.number}.`);
  } else {
    console.log(gh('issue', 'create', '--repo', repo, '--title', TITLE, '--body-file', notes));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv[2], process.argv[3]);
