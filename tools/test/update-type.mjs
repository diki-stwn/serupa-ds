// The update size script (tools/update-type.mjs) that the Dependabot workflow asks before it merges an update on its
// own: patches and minors pass, and a major, a 0.x minor, a new or removed dependency, or any other change goes to a
// person.
//   node tools/test/update-type.mjs
import { bump, updateType } from '../update-type.mjs';
import { done, report } from './lib.mjs';

const pkg = (dev) => JSON.stringify({ name: 'serupa-ds', version: '13.0.0', devDependencies: dev }, null, 2);
const files = (base, head) => (file, side) => (side === 'base' ? base : head)[file] ?? null;
const run = (base, head) => updateType(Object.keys({ ...base, ...head }).filter((f) => base[f] !== head[f]), files(base, head));

const grouped = run(
  { 'package.json': pkg({ vitest: '4.1.2', eslint: '10.0.1' }), 'package-lock.json': 'a' },
  { 'package.json': pkg({ vitest: '4.2.0', eslint: '10.0.3' }), 'package-lock.json': 'b' },
);
const major = run({ 'package.json': pkg({ storybook: '10.6.5' }) }, { 'package.json': pkg({ storybook: '11.0.0' }) });
const added = run({ 'package.json': pkg({ vitest: '4.1.2' }) }, { 'package.json': pkg({ vitest: '4.1.2', vite: '8.0.0' }) });
const script = run({ 'package.json': pkg({ vitest: '4.1.2' }) }, { 'package.json': JSON.stringify({ name: 'serupa-ds', version: '13.0.1', devDependencies: { vitest: '4.1.3' } }) });
const flow = (pin) => `jobs:\n  a:\n    steps:\n      - uses: actions/checkout@${pin}\n      - uses: ./.github/actions/playwright\n      - run: npm ci\n`;
const actions = run(
  { '.github/workflows/ci.yml': flow('3d3c42e5 # v7.0.1'), '.github/actions/playwright/action.yml': 'uses: actions/cache@55cc # v6.1.0' },
  { '.github/workflows/ci.yml': flow('9f00aa11 # v7.1.0'), '.github/actions/playwright/action.yml': 'uses: actions/cache@77dd # v6.1.1' },
);
const actionMajor = run({ '.github/workflows/ci.yml': flow('3d3c42e5 # v7.0.1') }, { '.github/workflows/ci.yml': flow('0b1c2d3e # v8.0.0') });
const sameComment = run({ '.github/workflows/ci.yml': flow('3d3c42e5 # v7.0.1') }, { '.github/workflows/ci.yml': flow('0b1c2d3e # v7.0.1') });
const editedStep = run({ '.github/workflows/ci.yml': flow('3d3c42e5 # v7.0.1') }, { '.github/workflows/ci.yml': flow('9f00aa11 # v7.1.0').replace('npm ci', 'npm ci --ignore-scripts') });
const source = run({ 'package.json': pkg({ vitest: '4.1.2' }), 'src/index.ts': 'a' }, { 'package.json': pkg({ vitest: '4.1.3' }), 'src/index.ts': 'b' });
const lockOnly = run({ 'package-lock.json': 'a' }, { 'package-lock.json': 'b' });

done(report('Update type', [
  { name: 'reads semver moves, a 0.x minor and a 0.0.x patch as majors, and anything not plain x.y.z or going down as other', ok: bump('1.2.3', '1.2.4') === 'patch' && bump('1.2.3', '1.3.0') === 'minor' && bump('1.2.3', '2.0.0') === 'major' && bump('0.18.5', '0.19.0') === 'major' && bump('0.18.5', '0.18.6') === 'patch' && bump('0.0.3', '0.0.4') === 'major' && bump('^1.2.3', '^1.3.0') === 'other' && bump('1.2.3', '1.3.0-beta.1') === 'other' && bump('1.3.0', '1.2.9') === 'other' && bump('1.2.3', '1.2.3') === 'none' },
  { name: 'a grouped update of a minor and a patch, with its lockfile, is a minor', ok: grouped.type === 'minor' && grouped.moves.length === 2, detail: JSON.stringify(grouped) },
  { name: 'one major in package.json makes it a major', ok: major.type === 'major', detail: JSON.stringify(major) },
  { name: 'a dependency added, or a change outside the dependency sections, is other', ok: added.type === 'other' && script.type === 'other', detail: JSON.stringify([added, script]) },
  { name: 'pinned actions read their version comments, in workflows and in local actions', ok: actions.type === 'minor' && actions.moves.map((m) => m.type).join() === 'minor,patch' && actionMajor.type === 'major', detail: JSON.stringify([actions, actionMajor]) },
  { name: 'a new commit under the same version comment, or a workflow line that changed besides the pin, is other', ok: sameComment.type === 'other' && editedStep.type === 'other', detail: JSON.stringify([sameComment, editedStep]) },
  { name: 'a file outside package.json, its lockfile and .github makes it other; a lockfile alone is none', ok: source.type === 'other' && lockOnly.type === 'none', detail: JSON.stringify([source, lockOnly]) },
]));
