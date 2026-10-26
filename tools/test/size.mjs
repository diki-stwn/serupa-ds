// Size budget: what each file a project loads weighs, gzipped, against its budget. Build first (npm run build).
//   node tools/test/size.mjs                  check
//   node tools/test/size.mjs --update Name    set Name's budgets from what it weighs now (5% and 0.1 KiB over); with no
//                                             name, only the component folders that have no budgets yet
//   node tools/test/size.mjs --update Name --only alone    set that one budget and keep the others
// The JavaScript is measured as a project's bundler ships it (minified, React left out, the full icon set left to
// load on demand). Over budget fails; when a change is worth the bytes, raise the budget in the same pull request,
// so the growth is a decision someone reviews.
//
// Each component folder has its own budgets, in tools/test/baseline-size/<Name>.json, so a component pull request
// edits only its own file (no two pull requests edit the same line):
//   alone  what a project that imports only this folder's exports ships, less the built-in label text (below)
//   share  what the folder adds to the whole package (all of index.js, less the same build without it)
//   css    what its CSS adds to components.css
// The totals grow with the folders' budgets: TOTALS below holds each total's budget and what the folders' shares
// (or CSS) added up to when it was set, and the budget moves by however much that sum has moved since. So adding a
// component, or raising one's budget, raises the totals too, and only a change to the shared code edits TOTALS.
// The built-in label text (enLabels: every folder's labels.ts) goes into every component's bundle, so a new label
// in one folder used to push other folders' "alone" over budget and send several pull requests to the same files.
// It has one budget of its own instead, LABELS, with room for a few dozen more labels; while the text is within it,
// a pull request that adds a label edits no budget, and the totals allow for it.
// CI writes the table to the run's summary page.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';
import { HERE, PROJECT, done, report } from './lib.mjs';

// A pull request whose shared code (src/internal, labels) grows on purpose may raise its line here itself, by up to
// 0.5 KiB, with a dated note saying what grew; a bigger raise needs a reason in the pull request.
// KiB, gzipped: [budget, the sum of the folders' budgets it was set at, which ones]. About 3 to 4% above the size
// when each was last set (index.js 62.2, serupa.iife.js 610.1 on 24 Oct 2026; components.css 27.3 once it shipped
// without the source comments).
const TOTALS = {
  'All components (index.js)': [68.5, 59.3, 'share'],   // +1.0 KiB on 25 Oct 2026: headroom for shared code (the trigger contract, internal/trigger.ts, G9, needs 0.2 with the total at its budget); +0.3 KiB on 25 Oct 2026: SerupaProvider keeping inline labels and icons stable (internal/provider.tsx, U2) needs 0.12 over the 48 B left; +0.2 KiB on 25 Oct 2026: the open-change reasons (internal/openChange.ts, #531) took the shared code 0.1 over once that day's merges landed together; +1.6 KiB on 25 Oct 2026: label text (every folder's labels.ts, FileUpload's refusal messages too) counts as shared code; +0.9 the same day: the accessible-name warnings (internal/nameCheck.ts)
  'components.css': [28.5, 53.6, 'css'],
  'serupa.iife.js': [630, 59.3, 'share'],
};
// KiB, gzipped: [budget, the size it was set at]. The totals that count shared code move with the budget.
const LABELS = [2.6, 1.9];
// Not made of component folders.
const FIXED = { 'utilities.css': 168, 'base.css': 1.85, 'theme.js': 2.2 };
// KiB, gzipped: Button bundled by a build that doesn't split dynamic imports (DM1), so the icon set drawn by name
// comes along (512.7 on 25 Oct 2026). Icon's README and Getting started say so; this keeps the number in sight.
const NO_SPLIT = 530;

const DIR = path.join(HERE, 'baseline-size');
const COMP = path.join(PROJECT, 'src', 'components');
const folders = fs.readdirSync(COMP).filter((n) => fs.statSync(path.join(COMP, n)).isDirectory()).sort();
const KEYS = ['alone', 'share', 'css'];

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
// Icons drawn by name are a dynamic import(): a project loads them only when a page draws an icon by its name.
const lazy = { name: 'lazy', setup(b) { b.onResolve({ filter: /.*/ }, (a) => a.kind === 'dynamic-import' ? { path: a.path, external: true } : undefined); } };
const build = async (code, plugins) => (await esbuild.build({ stdin: { contents: code, resolveDir: PROJECT }, bundle: true, minify: true, write: false, format: 'esm', external: ['react', 'react-dom'], plugins, logLevel: 'silent' })).outputFiles[0].contents;
const bundled = async (code) => gz(await build(code, [lazy]));
const file = (f) => gz(fs.readFileSync(path.join(PROJECT, 'dist', f)));

// What each folder exports (its index.ts, as the package's index.js re-exports it), and its CSS in the build's order.
const exportsOf = (n) => [...fs.readFileSync(path.join(COMP, n, 'index.ts'), 'utf8').matchAll(/^export \{ ([^}]*) \} from/gm)].flatMap((m) => m[1].split(',').map((x) => x.trim()).filter(Boolean));
const names = Object.fromEntries(folders.map((n) => [n, exportsOf(n)]));
const order = [...fs.readFileSync(path.join(PROJECT, 'src', 'generated', 'components.css'), 'utf8').matchAll(/@import "\.\.\/components\/(\w+)\/([\w.-]+\.css)";/g)].map((m) => [m[1], fs.readFileSync(path.join(COMP, m[1], m[2]), 'utf8')]);
const cssWithout = (n) => gz(Buffer.from(order.filter(([c]) => c !== n).map(([, t]) => t).join('\n')));
const pick = (list) => `export { ${list.join(', ')} } from './dist/index.js';`;

const all = folders.flatMap((n) => names[n]);
const whole = await bundled(pick(all));
const labels = await bundled(pick(['enLabels']));
const cssWhole = cssWithout(null);
const measured = Object.fromEntries(await Promise.all(folders.map(async (n) => [n, {
  alone: await bundled(pick([...names[n], 'enLabels'])) - labels,   // with the label text added and taken off again, so a folder that has none isn't measured below its size
  share: whole - await bundled(pick(all.filter((x) => !names[n].includes(x)))),
  css: cssWhole - cssWithout(n),
}])));

const kib = (n) => (n / 1024).toFixed(1);
const budgetFile = (n) => path.join(DIR, `${n}.json`);
const ui = process.argv.indexOf('--update');
if (ui > 0) {
  const asked = process.argv.slice(ui + 1).filter((a, i, all) => !a.startsWith('-') && all[i - 1] !== '--only');
  const which = asked.length ? asked : folders.filter((n) => !fs.existsSync(budgetFile(n)));
  fs.mkdirSync(DIR, { recursive: true });
  for (const n of which) {
    if (!measured[n]) { console.log(`No component folder ${n}`); process.exit(1); }
    // 5% over plus 0.1 KiB, rounded up, so a small fix doesn't fail on a few bytes.
    // --only alone (or share, css) sets that budget alone and keeps the others.
    const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
    const kept = only && fs.existsSync(budgetFile(n)) ? JSON.parse(fs.readFileSync(budgetFile(n), 'utf8')) : {};
    const b = Object.fromEntries(KEYS.map((k) => [k, only && k !== only && k in kept ? kept[k] : Math.ceil((Math.max(0, measured[n][k]) / 1024 * 1.05 + 0.1) * 10) / 10]));
    fs.writeFileSync(budgetFile(n), JSON.stringify(b, null, 2) + '\n');
    console.log(`${n}: ${KEYS.map((k) => `${k} ${b[k]} KiB`).join(', ')}`);
  }
  process.exit(0);
}

const budgets = Object.fromEntries(folders.map((n) => [n, fs.existsSync(budgetFile(n)) ? JSON.parse(fs.readFileSync(budgetFile(n), 'utf8')) : null]));
const sum = (k) => folders.reduce((t, n) => t + (budgets[n]?.[k] || 0), 0);
const BUDGET = { ...Object.fromEntries(Object.entries(TOTALS).map(([f, [at, was, k]]) => [f, +(at + sum(k) - was + (k === 'share' ? LABELS[0] - LABELS[1] : 0)).toFixed(1)])), ...FIXED };
BUDGET['bundle.css'] = +(BUDGET['components.css'] + BUDGET['utilities.css']).toFixed(1);
const size = { 'All components (index.js)': whole };
for (const f of ['components.css', 'utilities.css', 'bundle.css', 'base.css', 'theme.js', 'serupa.iife.js']) size[f] = file(f);

const rows = Object.entries(BUDGET).map(([name, budget]) => ({ name, now: size[name], budget }));
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Size (gzipped)\n\n| | Size | Budget | |\n| --- | ---: | ---: | --- |\n${rows.map((r) => `| ${r.name} | ${kib(r.now)} KiB | ${r.budget} KiB | ${r.now <= r.budget * 1024 ? 'ok' : '**over**'} |`).join('\n')}\n`);
}
const totals = rows.map((r) => ({
  name: `${r.name}: ${kib(r.now)} KiB gzipped, within ${r.budget} KiB`,
  // Under 1 KiB means it wasn't measured (a budget number pasted in place of the measurement), not that it's tiny.
  ok: r.now <= r.budget * 1024 && r.now >= 1024,
  detail: r.now < 1024 ? 'not measured: its line in `size` must measure the build, not repeat the budget'
    : `${kib(r.now - r.budget * 1024)} KiB over; ${r.name in FIXED ? 'if the growth is worth it, raise its budget in tools/test/size.mjs' : 'the shared code grew (each component is held to its own budget): if that is worth it, raise its line in TOTALS in tools/test/size.mjs'}`,
}));
const noSplit = gz(await build(pick(['Button']), []));
totals.push({ name: `Button in a build without code splitting (the icon set comes along): ${kib(noSplit)} KiB gzipped, within ${NO_SPLIT} KiB`,
  ok: noSplit <= NO_SPLIT * 1024 && noSplit > 100 * 1024,
  detail: noSplit <= 100 * 1024 ? 'the icon set no longer comes along: lower NO_SPLIT in tools/test/size.mjs and update Icon\'s README and Getting started'
    : `${kib(noSplit - NO_SPLIT * 1024)} KiB over: the icons drawn by name grew; if that's worth it, raise NO_SPLIT in tools/test/size.mjs` });
totals.push({ name: `Built-in label text (enLabels): ${kib(labels)} KiB gzipped, within ${LABELS[0]} KiB`, ok: labels <= LABELS[0] * 1024 && labels >= 512,
  detail: labels < 512 ? 'not measured: enLabels should bundle every folder\'s labels.ts' : `${kib(labels - LABELS[0] * 1024)} KiB over; if the words are worth it, raise LABELS in tools/test/size.mjs (and its second number to the size now)` });
const LABEL = { alone: 'imported alone', share: 'adds to the whole package', css: 'adds to components.css' };
const own = folders.flatMap((n) => (budgets[n]
  ? KEYS.map((k) => ({ name: `${n} ${LABEL[k]}: ${kib(measured[n][k])} KiB, within ${budgets[n][k]} KiB`, ok: measured[n][k] <= budgets[n][k] * 1024,
    detail: `${kib(measured[n][k] - budgets[n][k] * 1024)} KiB over; if the growth is worth it, raise "${k}" in tools/test/baseline-size/${n}.json` }))
  : [{ name: `${n} has size budgets`, ok: false, detail: `run node tools/test/size.mjs --update ${n} and commit tools/test/baseline-size/${n}.json` }]));
const orphans = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => !folders.includes(f.replace(/\.json$/, ''))) : [];
done(report('Size', [...totals, ...own, { name: 'every size budget file belongs to a component folder', ok: !orphans.length, detail: orphans.join(', ') }]));
