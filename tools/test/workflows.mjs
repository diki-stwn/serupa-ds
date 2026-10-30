// The GitHub workflows and Dependabot, checked for the supply-chain rules in tools/README.md ("Workflows"):
// - every action is pinned to a full commit SHA, with its version as a comment (a tag can be moved to other code);
// - text a pull request's author controls (branch name, title, body…) never goes straight into a run: script,
//   only through env: (a branch called `x";curl …|sh;"` would run otherwise);
// - no checkout keeps a token in .git/config (persist-credentials: false): a push passes its token to that one git call;
// - a job that runs installed dependencies or the branch's own actions (npm ci, npx, uses: ./) gets no secrets and no
//   id-token: write, so a hijacked package or a pull request's code never runs beside a token that outlives the job
//   or can sign for the repository;
// - Dependabot waits 7 days before it offers a new release (cooldown).
//   node tools/test/workflows.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const GH = path.join(PROJECT, '.github');
const files = [
  ...fs.readdirSync(path.join(GH, 'workflows')).filter((f) => f.endsWith('.yml')).map((f) => 'workflows/' + f),
  ...fs.readdirSync(path.join(GH, 'actions')).map((d) => `actions/${d}/action.yml`).filter((f) => fs.existsSync(path.join(GH, f))),
];
// Expressions an outside contributor can fill: anything under github.event except numbers, SHAs and fixed names.
const UNTRUSTED = /\$\{\{\s*github\.(head_ref|event\.(?!(pull_request\.)?(number|base\.sha|head\.sha|workflow_run\.head_sha)\b|label\.name\b|pull_request\.head\.repo\.full_name\b)[\w.]+)/;

for (const f of files) {
  const lines = fs.readFileSync(path.join(GH, f), 'utf8').split('\n');
  const unpinned = [], injected = [], checkouts = [];
  let inRun = -1;
  lines.forEach((line, i) => {
    const indent = line.search(/\S/);
    if (inRun >= 0 && line.trim() && indent <= inRun) inRun = -1;
    const uses = line.match(/^\s*-?\s*uses:\s*(\S+)(.*)$/);
    if (uses && !uses[1].startsWith('./')) {
      if (!/@[0-9a-f]{40}$/.test(uses[1]) || !/#\s*v\d+\.\d+\.\d+/.test(uses[2])) unpinned.push(`${i + 1}: ${uses[1]}`);
      if (uses[1].startsWith('actions/checkout@')) {
        const step = []; for (let j = i + 1; j < lines.length && !/^\s*-\s/.test(lines[j]) && lines[j].search(/\S/) > indent; j++) step.push(lines[j]);
        checkouts.push({ line: i + 1, keeps: !step.some((l) => /persist-credentials:\s*false/.test(l)) });
      }
    }
    const run = line.match(/^(\s*)-?\s*run:\s*(.*)$/);
    if (run) { if (UNTRUSTED.test(run[2])) injected.push(`${i + 1}`); if (/^[|>]/.test(run[2].trim())) inRun = indent; }
    else if (inRun >= 0 && UNTRUSTED.test(line)) injected.push(`${i + 1}`);
  });
  t(`${f}: every action is pinned to a commit SHA, with its version as a comment`, !unpinned.length, unpinned.join(', '));
  t(`${f}: no pull request text is pasted into a run: script (pass it through env:)`, !injected.length, `line ${injected.join(', ')}`);
  if (checkouts.length) {
    const keeps = checkouts.filter((c) => c.keeps).map((c) => c.line);
    t(`${f}: its checkouts keep no token (persist-credentials: false)`, !keeps.length, `line ${keeps.join(', ')}`);
  }
  // Each job: the lines from its name (two spaces in, under jobs:) to the next job's.
  const start = lines.findIndex((l) => /^jobs:/.test(l));
  if (start >= 0) {
    const heads = lines.map((l, i) => (i > start && /^ {2}[\w-]+:\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
    for (const [k, h] of heads.entries()) {
      const job = lines.slice(h, heads[k + 1] ?? lines.length).map((l) => (/^\s*#/.test(l) ? '' : l));   // comments don't count
      const runs = job.some((l) => /\bnpm (ci|install|i)\b|\bnpx\b|^\s*-?\s*uses:\s*\.\//.test(l));
      const secret = job.findIndex((l) => /\$\{\{\s*secrets\./.test(l));
      if (runs) t(`${f}: job ${lines[h].trim().slice(0, -1)} runs dependencies, so it gets no secrets`, secret < 0, `line ${h + secret + 1}`);
      // An OIDC token proves "this repository's workflow made it" to GitHub and other services (a build attestation,
      // a cloud login), so code that can ask for one is as trusted as a secret.
      const oidc = job.findIndex((l) => /^\s*id-token:\s*write\b/.test(l));
      if (runs) t(`${f}: job ${lines[h].trim().slice(0, -1)} runs dependencies, so it can't ask for an OIDC token (id-token: write)`, oidc < 0, `line ${h + oidc + 1}`);
    }
  }
}

const dependabot = fs.readFileSync(path.join(GH, 'dependabot.yml'), 'utf8');
const ecosystems = dependabot.split(/^\s*- package-ecosystem:/m).slice(1);
for (const e of ecosystems) {
  const days = Number((e.match(/default-days:\s*(\d+)/) || [])[1] || 0);
  t(`dependabot.yml: ${e.trim().split(/\s/)[0]} updates wait at least 7 days after a release (cooldown)`, days >= 7, `default-days: ${days}`);
}

done(report('Workflows', R));
