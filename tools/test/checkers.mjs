// Checkers that must fail: each check that guards a rule is run on a small project that breaks it, and has to fail
// there, naming what broke. A check that stops matching (a regex that drifts, a file it no longer finds) then goes
// red here instead of passing silently on the real project. The Stylelint rules have their own failing cases
// (stylelint-rules.mjs).
//   node tools/test/checkers.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HERE, PROJECT, report, done } from './lib.mjs';

const R = [];
const fixture = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-checker-'));
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), body); }
  return dir;
};
// Runs a check as a script (not under Vitest, which would own its results) and reads back each result it printed.
const run = (script, dir, { arg = false } = {}) => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VITEST')));
  const out = spawnSync(process.execPath, [path.join(HERE, script), ...(arg ? [dir] : [])], { env: { ...env, SERUPA_PROJECT: dir }, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const results = [];
  for (const line of out.stdout.split('\n')) {
    const m = /^(PASS|FAIL) {2}(.*)$/.exec(line);
    if (m) results.push({ ok: m[1] === 'PASS', name: m[2], detail: '' });
    else if (/^ {6}/.test(line) && results.length) results[results.length - 1].detail += line.trim() + ' ';
  }
  return { status: out.status, results, output: out.stdout + out.stderr };
};
// want: [the start of a result's name, a word its detail has to name]
const expect = (label, { status, results, output }, want) => {
  R.push({ name: `${label}: exits as failed`, ok: status === 1, detail: `exit ${status}: ${output.slice(-300)}` });
  for (const [name, word] of want) {
    const r = results.find((x) => x.name.startsWith(name) && !x.ok && x.detail.includes(word));
    R.push({ name: `${label}: fails "${name}" on ${word}`, ok: !!r, detail: results.filter((x) => x.name.startsWith(name)).map((x) => `${x.ok ? 'PASS' : 'FAIL'} ${x.name}: ${x.detail}`).join(' | ') || 'no such result' });
  }
};

// Workflows: an action on a tag, a pull request's title pasted into a script, a checkout that keeps its token, a
// secret or an OIDC token in a job that runs dependencies, and Dependabot with no cooldown.
expect('workflows.mjs', run('workflows.mjs', fixture({
  '.github/actions/.keep': '',
  '.github/workflows/bad.yml': `on: pull_request
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
      - run: echo "\${{ github.event.pull_request.title }}"
  deploy:
    runs-on: ubuntu-24.04
    steps:
      - run: npm ci
      - run: npm run build
        env:
          TOKEN: \${{ secrets.BOT_TOKEN }}
  attest:
    runs-on: ubuntu-24.04
    permissions:
      id-token: write
    steps:
      - run: npx some-tool
`,
  '.github/dependabot.yml': `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
`,
})), [
  ['workflows/bad.yml: every action is pinned', 'actions/checkout@v7'],
  ['workflows/bad.yml: no pull request text', 'line 8'],
  ['workflows/bad.yml: its checkouts keep no token', 'line 6'],
  ['workflows/bad.yml: job deploy runs dependencies, so it gets no secrets', 'line 15'],
  ['workflows/bad.yml: job attest runs dependencies, so it can\'t ask for an OIDC token', 'line 19'],
  ['dependabot.yml: npm updates wait', 'default-days: 0'],
]);

// Browser baseline: a misspelt property, one Firefox 128 lacks, an @supports every baseline browser passes, a
// built-in Safari 17.5 lacks, and a README that names no baseline.
expect('browser-baseline.mjs', run('browser-baseline.mjs', fixture({
  'dist/bundle.css': '.a { colr: red; }\n.b { anchor-name: --b; }\n@supports (display: grid) { .c { display: grid; } }\n',
  'dist/utilities-extra.css': '',   // read with bundle.css (the masks and gradients)
  'dist/serupa.iife.js': 'Promise.try(() => 1);\n',
  'README.md': '# Fixture\n\n## Browser support\n\nAny.\n',
}), { arg: true }), [
  ['bundle.css: every property is a known CSS property', 'colr'],
  ['bundle.css works in Chrome and Edge', 'anchor-name'],
  ['No @supports tests for what the baseline already has', 'display: grid'],
  ['serupa.iife.js: every static built-in works at the baseline', 'Promise.try'],
  ['KNOWN lists only what the baseline lacks', '@starting-style'],
  ['The README states the same baseline', 'Safari'],
]);

// Package lint: an export whose types file isn't in the package (publint), and one whose types are CommonJS for an
// ES module (Are the Types Wrong).
expect('package-lint.mjs', (() => {
  const dir = fixture({
    'package.json': JSON.stringify({ name: 'fixture', version: '1.0.0', type: 'module', files: ['dist'], exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' }, './b': { types: './dist/b.d.cts', default: './dist/b.js' } } }),
    'dist/index.js': 'export const a = 1;\n',
    'dist/b.js': 'export const b = 1;\n',
    'dist/b.d.cts': 'export declare const b: number;\n',
  });
  fs.symlinkSync(path.join(PROJECT, 'node_modules'), path.join(dir, 'node_modules'));
  return run('package-lint.mjs', dir);
})(), [
  ['publint finds nothing', 'index.d.ts'],
  ['Are the Types Wrong', 'FalseCJS'],
]);

done(report('Checkers that must fail', R));
