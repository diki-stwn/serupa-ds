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

// What the package exports, read from dist/index.d.ts's export lists and declarations.
const dts = built ? fs.readFileSync(path.join(PROJECT, 'dist', 'index.d.ts'), 'utf8') : '';
const exported = new Set();
for (const m of dts.matchAll(/^export (?:type )?\{([^}]*)\}/gm)) for (const n of m[1].split(',')) { const x = n.trim().split(/\s+as\s+/).pop(); if (x) exported.add(x); }
for (const m of dts.matchAll(/^export (?:declare )?(?:const|function|interface|type|class) (\w+)/gm)) exported.add(m[1]);
// Every interface or type a component file exports reaches the package, so a project can name a prop's type
// (TreeView's items as TreeViewItem[]). labels.ts files are left out: their types make up SerupaLabels.
const COMP = path.join(PROJECT, 'src', 'components');
const unexported = [];
for (const dir of fs.readdirSync(COMP)) for (const f of fs.readdirSync(path.join(COMP, dir))) {
  if (!/\.tsx?$/.test(f) || f === 'labels.ts' || f === 'index.ts' || /\.(test|stories)\./.test(f)) continue;
  for (const m of fs.readFileSync(path.join(COMP, dir, f), 'utf8').matchAll(/^export (?:interface|type) (\w+)/gm)) if (!exported.has(m[1])) unexported.push(`${dir}/${f}: ${m[1]}`);
}
R.push({ name: 'every type a component file exports is exported by the package (its folder\'s index.ts)', ok: built && !unexported.length, detail: unexported.join(', ') });
// Every name a README or guide imports from serupa-ds is one the package exports.
const docs = [path.join(PROJECT, 'README.md'), ...fs.readdirSync(path.join(PROJECT, 'docs')).filter((f) => /\.mdx?$/.test(f) && !f.includes('template')).map((f) => path.join(PROJECT, 'docs', f)),
  ...fs.readdirSync(COMP).map((d) => path.join(COMP, d, 'README.md')).filter((f) => fs.existsSync(f))];
const unknown = [];
for (const f of docs) for (const m of fs.readFileSync(f, 'utf8').matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']serupa-ds["']/g)) {
  for (const n of m[1].split(',')) { const x = n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]; if (x && !exported.has(x)) unknown.push(`${path.relative(PROJECT, f)}: ${x}`); }
}
R.push({ name: 'every name a README or guide imports from serupa-ds is exported', ok: built && !unknown.length, detail: unknown.join(', ') });
// What the package costs a project's type check (E10), counted by tsc for consumer.tsx: types and instantiations are
// the same on every run and machine (the time isn't). Measured on 25 Oct 2026 at 92,126 and 197,269, about 15,000 of
// the types being the Material Symbol names in IconName, which cost about 10 ms and 2.5 MB and give autocomplete, so
// they stay. The budgets are about 10% over; a TypeScript upgrade that moves the counts may raise them. SegmentedControl's
// and Combobox's typed values (83) cost about 1,900 and 470 instantiations, which took them from 216,882 to about 219,300. SkipLink and Prose (31 Oct) took it to about 220,200 and past the
// budget, which moved to 223,000.
const BUDGET = { Types: 101000, Instantiations: 223000 };
const diag = built && spawnSync(process.execPath, [tsc, '-p', path.join(HERE, 'types'), '--extendedDiagnostics'], { cwd: PROJECT, encoding: 'utf8' });
for (const [what, budget] of Object.entries(BUDGET)) {
  const n = diag ? Number((diag.stdout.match(new RegExp(`^${what}:\\s+(\\d+)`, 'm')) || [])[1]) : NaN;
  R.push({ name: `a project's type check of consumer.tsx makes ${n.toLocaleString('en')} ${what.toLowerCase()}, within ${budget.toLocaleString('en')}`, ok: n > 0 && n <= budget,
    detail: Number.isNaN(n) ? 'tsc printed no count: npm run build first' : `${(n - budget).toLocaleString('en')} over: a type that grew this much slows every project's editor; raise BUDGET in tools/test/types.mjs only if it's worth it` });
}
done(report('Types', R));
