// Runs the whole suite: node tools/test/run.mjs   (add --update to accept new baselines, --list to see the steps,
// --since <ref> to test only the components changed since then)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { HERE, PROJECT, affectedComponents, onlyComponents, withDependents } from './lib.mjs';

const update = process.argv.includes('--update') ? ['--update'] : [];
// --browser firefox|webkit runs the Playwright suites in that engine; --compat safari|firefox|webkitgtk adds the
// cross-browser comparison through WebDriver (see compat.mjs).
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (arg('--browser')) process.env.SERUPA_BROWSER = arg('--browser');
// --locale ar runs the component tests with the browser in that language (SERUPA_LOCALE, vitest.config.ts).
if (arg('--locale')) process.env.SERUPA_LOCALE = arg('--locale');
// A full run on CI (main, the merge queue) runs the component tests a second time with the browser in one of these
// languages, picked by the commit, so a component that reads the browser's language where it should take the
// provider's, or a test that expects English without saying so, fails within a few merges. Right-to-left, comma
// decimals, Thai and Japanese scripts. To repeat one: node tools/test/run.mjs --group components --locale id-ID.
const LOCALES = ['ar', 'id-ID', 'th', 'ja'];
// The visual and Storybook steps, by group. They drive a browser through every preview and story, sharded across
// CI jobs, so they stay scripts of their own.
const GROUPS = {
  visual: [['Visual snapshots', 'visual.mjs', ...update]],
  storybook: [['Storybook', 'storybook.mjs']],
};
// --since <ref> (CI on a pull request): when every changed file belongs to a component folder, the component tests,
// visual snapshots and Storybook checks cover only those components and the ones that use them (SERUPA_ONLY). The checks always run whole.
if (arg('--since')) {
  const diff = spawnSync('git', ['diff', '--name-only', arg('--since'), 'HEAD'], { cwd: PROJECT, encoding: 'utf8' });
  const changed = diff.status === 0 ? affectedComponents(diff.stdout.split('\n').filter(Boolean)) : null;
  const names = changed && withDependents(changed);
  if (names) process.env.SERUPA_ONLY = [...names].sort().join(',');
  console.log(names ? `Testing the changed components and the ones that use them: ${[...names].sort().join(', ') || 'none'} (main runs everything)` : 'Testing everything: the change reaches beyond the component folders');
}
const only = onlyComponents();
// The tests that check every story against a baseline or a rule: a change to one component can break its line in them.
const STORY_WIDE = ['hydrateStories', 'serverHtml', 'ariaStories', 'tabWalk', 'leaks', 'network'].map((f) => `src/internal/${f}.test.tsx`);
const node = (g) => ([name, f, ...args]) => [name, 'node', [path.join(HERE, f), ...args], g];
const vitest = (name, project, g, ...args) => [name, process.execPath, [path.join(PROJECT, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--project', project, ...args], g];
const steps = [
  // The component tests next to each component (src/components/<Name>/<Name>.test.tsx), in a browser. Coverage
  // only on a full run: the floors in vitest.config.ts are for all of src/, which a few components can't reach.
  // With SERUPA_ONLY, the tests that go through every story (STORY_WIDE) run too, on those components' stories.
  vitest('Component tests (Vitest)', 'components', 'components', ...(process.env.SERUPA_COVERAGE && !only ? ['--coverage'] : []), ...(only ? [...[...only].map((n) => `src/components/${n}/`), ...STORY_WIDE] : [])),
  ...(process.env.CI && !arg('--since') && !arg('--locale') ? [(() => {
    const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: PROJECT, encoding: 'utf8' }).stdout.trim();
    const locale = LOCALES[parseInt(sha.slice(0, 8) || '0', 16) % LOCALES.length];
    return [...vitest(`Component tests in ${locale} (Vitest)`, 'components', 'components'), { SERUPA_LOCALE: locale }];
  })()] : []),
  // --update first accepts the current API and utility classes as the baselines the checks compare with.
  ...(update.length ? [['Public API', 'api.mjs', ...update], ['Utility classes', 'utilities.mjs', ...update]].map(node('checks')) : []),
  // Every other script in tools/test/ is a check (package, tokens, icons, guides, …), run by Vitest's checks project
  // (vitest.config.ts): a new one needs no entry here.
  vitest('Checks (Vitest)', 'checks', 'checks'),
  ...Object.entries(GROUPS).flatMap(([g, list]) => list.map(node(g))),
];
if (arg('--group')) {
  const g = arg('--group');
  if (!steps.some((step) => step[3] === g)) { console.error(`Unknown --group "${g}" (checks, components, visual or storybook)`); process.exit(2); }
  steps.splice(0, steps.length, ...steps.filter((step) => step[3] === g));
}
// No component changed (a changeset alone): nothing for the component, visual or Storybook steps to cover.
if (only && !only.size) steps.splice(0, steps.length, ...steps.filter((step) => step[3] === 'checks'));
if (arg('--compat')) steps.push([`Cross-browser (${arg('--compat')})`, 'node', [path.join(HERE, 'compat.mjs'), '--engine', arg('--compat'), ...(arg('--driver') ? ['--driver', arg('--driver')] : [])]]);
// --list prints the steps (of the --group, if one is given) without running them.
if (process.argv.includes('--list')) { for (const [name, , args, g] of steps) console.log(`${g}\t${name}\t${path.basename(args[0])}`); process.exit(0); }
const summary = [];
for (const [name, cmd, args, , env] of steps) {
  console.log(`\n━━ ${name} ━━`);
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: PROJECT, env: { ...process.env, SERUPA_PROJECT: PROJECT, ...env } });
  summary.push([name, r.status === 0, Date.now() - t0]);
}
console.log('\n━━ Summary ━━');
for (const [name, ok, ms] of summary) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${(ms / 1000).toFixed(1)}s)`);
process.exit(summary.every(([, ok]) => ok) ? 0 : 1);
