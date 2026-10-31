// Dead code (E8): knip (knip.json) follows the imports from the package's entry points, the tools, the stories and
// the tests, and fails on a file nothing imports, an export nobody uses, or a dependency nothing needs.
//   node tools/test/unused.mjs
// Clean when it was added (25 Oct 2026). A finding means delete the code, or export it from the package if it's meant
// to be public; knip.json's ignore lists are for what knip can't see being used, with the reason next to it.
// A second run in production mode (SCB3) follows only the entries marked ! in knip.json, so it leaves out the tests and
// stories and finds an export that only a test keeps alive. Those are dead code too, except a deliberate test seam: a
// test-only hook into module state (cooling the tooltip warm-up, waiting for the announcer, forgetting warnings). A
// seam says @testseam in its JSDoc, and that tag is allowed only on the exports listed in SEAMS below, so a new seam is
// a choice made here and not a tag added to quiet the check.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, done, report } from './lib.mjs';
import { buildRegistry } from '../build/registry.mjs';

buildRegistry(PROJECT);   // src/generated/ imports every component's labels.ts and index.ts
// --no-gitignore: src/generated/ isn't committed, but it's what uses each component's index.ts and labels.
const knip = (...extra) => {
  const run = spawnSync(process.execPath, [path.join(PROJECT, 'node_modules', 'knip', 'bin', 'knip.js'), '--no-progress', '--no-gitignore', '--reporter', 'compact', ...extra], { cwd: PROJECT, encoding: 'utf8' });
  return { ok: run.status === 0, detail: (run.stdout + run.stderr).split('\n').filter(Boolean).slice(0, 20).join(' | ') };
};
const all = knip(), production = knip('--production', '--tags=-testseam');

const SEAMS = ['src/components/Tooltip/Tooltip.tsx: coolTooltips', 'src/internal/announce.ts: announcerIdle', 'src/internal/warn.ts: resetWarnings'];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? (e.name === 'generated' ? [] : walk(p)) : /\.tsx?$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name) ? [p] : [];
});
const tagged = walk(path.join(PROJECT, 'src')).flatMap((f) => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  return lines.flatMap((line, i) => {
    if (!/@testseam/.test(line)) return [];
    let j = i; while (j < lines.length && !/\*\//.test(lines[j])) j++;
    const name = (/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/.exec(lines[j + 1] || '') || [])[1] || '?';
    return [`${path.relative(PROJECT, f)}: ${name}`];
  });
});
const extra = tagged.filter((s) => !SEAMS.includes(s)), missing = SEAMS.filter((s) => !tagged.includes(s));

done(report('Unused code', [
  { name: 'knip: no unused files, exports or dependencies', ok: all.ok, detail: all.detail },
  { name: 'knip --production: no export that only a test or a story keeps', ok: production.ok, detail: production.detail },
  { name: `@testseam is on the listed seams and nowhere else (${SEAMS.length})`, ok: !extra.length && !missing.length,
    detail: [extra.length && `not a listed seam: ${extra.join(', ')} (delete the export, or add it to SEAMS in tools/test/unused.mjs with why)`, missing.length && `listed but untagged: ${missing.join(', ')}`].filter(Boolean).join('; ') },
]));
