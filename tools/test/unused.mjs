// Dead code (E8): knip (knip.json) follows the imports from the package's entry points, the tools, the stories and
// the tests, and fails on a file nothing imports, an export nobody uses, or a dependency nothing needs.
//   node tools/test/unused.mjs
// Clean when it was added (25 Oct 2026). A finding means delete the code, or export it from the package if it's meant
// to be public; knip.json's ignore lists are for what knip can't see being used, with the reason next to it.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, done, report } from './lib.mjs';
import { buildRegistry } from '../build/registry.mjs';

buildRegistry(PROJECT);   // src/generated/ imports every component's labels.ts and index.ts
// --no-gitignore: src/generated/ isn't committed, but it's what uses each component's index.ts and labels.
const run = spawnSync(process.execPath, [path.join(PROJECT, 'node_modules', 'knip', 'bin', 'knip.js'), '--no-progress', '--no-gitignore', '--reporter', 'compact'], { cwd: PROJECT, encoding: 'utf8' });
const lines = (run.stdout + run.stderr).split('\n').filter(Boolean);
done(report('Unused code', [{ name: 'knip: no unused files, exports or dependencies', ok: run.status === 0, detail: lines.slice(0, 20).join(' | ') }]));
