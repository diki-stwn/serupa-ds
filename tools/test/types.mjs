// Type-level tests (D2): types/consumer.tsx, a project using the package, compiles against the built types
// (dist/index.d.ts and dist/icons.d.ts, found through package.json's exports) under each module resolution projects
// use. Its assertions are what the types promise (a Button with href takes an anchor's ref, onValueChange gets
// Date | null, IconButton needs a label); its @ts-expect-error lines are mistakes the types must keep catching.
// api.mjs notices that the types changed; this says whether they still do what projects rely on. Build first.
//   node tools/test/types.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HERE, PROJECT, done, report } from './lib.mjs';

const tsc = path.join(PROJECT, 'node_modules', 'typescript', 'bin', 'tsc');
const built = fs.existsSync(path.join(PROJECT, 'dist', 'index.d.ts'));
// Vite, Next.js and other bundlers; Node's own ES modules (a server or a test runner without a bundler).
const MODES = [['Bundler', 'ESNext'], ['NodeNext', 'NodeNext'], ['Node16', 'Node16']];
const R = MODES.map(([resolution, module]) => {
  const run = built && spawnSync(process.execPath, [tsc, '-p', path.join(HERE, 'types'), '--moduleResolution', resolution, '--module', module], { cwd: PROJECT, encoding: 'utf8' });
  const errors = run ? (run.stdout + run.stderr).split('\n').filter((l) => /error TS/.test(l)).map((l) => l.replace(/^.*types[\\/]/, '')) : ['dist/index.d.ts is missing: npm run build first'];
  return { name: `consumer.tsx type-checks against the package (moduleResolution ${resolution})`, ok: run && run.status === 0, detail: errors.slice(0, 10).join(' | ') };
});
done(report('Types', R));
