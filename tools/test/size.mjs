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
//   alone  what a project that imports only this folder's exports ships, its own words (labels.ts) included
//   share  what the folder adds to the whole package (all of index.js, less the same build without it)
//   css    what its CSS adds to components.css
// The totals grow with the folders' budgets: TOTALS below holds each total's budget and what the folders' shares
// (or CSS) added up to when it was set, and the budget moves by however much that sum has moved since. So adding a
// component, or raising one's budget, raises the totals too, and only a change to the shared code edits TOTALS.
// The built-in label text (enLabels: every folder's labels.ts) has one budget of its own, LABELS, with room for a few
// dozen more labels; while the text is within it, a pull request that adds a label edits no total, and the totals
// allow for it. A component's bundle carries only its own words and the shared ones (GL4, 26 Oct 2026): before, it
// carried every folder's, about 1.9 KiB gzipped, so "alone" was measured without them.
// Also held: tokens.css (it ships from the package root), the two font files (as they are: woff2 is already
// compressed), and a starter page, what a first page with a sign-in form costs (STARTER below).
// CI writes the table to the run's summary page, with each file's Brotli size beside it (most servers send Brotli;
// the budgets stay on gzip).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import * as esbuild from 'esbuild';
import { HERE, PROJECT, done, report } from './lib.mjs';
import { purge, unusedComponentClasses, usedClasses } from '../../bin/serupa-purge.mjs';

// A pull request whose shared code (src/internal, labels) grows on purpose may raise its line here itself, by up to
// 0.5 KiB, with a dated note saying what grew; a bigger raise needs a reason in the pull request.
// KiB, gzipped: [budget, the sum of the folders' budgets it was set at, which ones]. About 3 to 4% above the size
// when each was last set (index.js 62.2, serupa.iife.js 610.1 on 24 Oct 2026; components.css 27.3 once it shipped
// without the source comments).
const TOTALS = {
  'All components (index.js)': [72.7, 59.3, 'share'],   // +0.5 KiB on 1 Nov 2026: main sat at 0 B spare, and TableRow href (TF3) takes the bundle 0.2 over; the rest is room for the narrow-screen and shadow-root fixes queued behind it; +0.2 KiB on 1 Nov 2026: Slider refits its end labels when a web font changes their width (main sat within bytes of the line and this took it 99 B over); +1.0 KiB on 31 Oct 2026: a standing margin (main at 113.4 of 113.6, and four queued accessibility fixes, RelativeTime and the untilFound helper for ErrorSummary, Accordion and Tabs, add about 0.4; it leaves about 0.8 spare after them, so a one-line fix doesn't need a raise of its own); +0.3 KiB on 31 Oct 2026: headroom for one-line accessibility fixes (RadioGroup ref.focus, #1191, leaves main at 0 B spare, and CheckboxGroup's ref.current.focus() needs 5 B more); +0.2 KiB on 31 Oct 2026: the shared field-control call (useFieldControl) in Slider (#1172) took main 16 B over, and SegmentedControl (#1173) and ColorPicker (#1175) add the same call; +1.0 KiB on 31 Oct 2026: headroom for shared code (after #1047 main sat within bytes of the line and #1048 went 3 B over; three lanes land shared code at once, and 0.5 left none for the day); +0.5 KiB on 31 Oct 2026: headroom for shared code (#997, #1000, #1001 and #1002 landed together and took main 57 B over); +0.5 KiB on 26 Oct 2026: headroom for shared code (main sat 0.2 KiB under, and #735, #777 and #781 each went 0.0 to 0.1 over it); +0.2 KiB on 26 Oct 2026: Firefox strict-CSP server styles applied from React's props (internal/serverStyles.ts, FW1); +1.0 KiB on 25 Oct 2026: headroom for shared code (the trigger contract, internal/trigger.ts, G9, needs 0.2 with the total at its budget); +0.3 KiB on 25 Oct 2026: SerupaProvider keeping inline labels and icons stable (internal/provider.tsx, U2) needs 0.12 over the 48 B left; +0.2 KiB on 25 Oct 2026: the open-change reasons (internal/openChange.ts, #531) took the shared code 0.1 over once that day's merges landed together; +1.6 KiB on 25 Oct 2026: label text (every folder's labels.ts, FileUpload's refusal messages too) counts as shared code; +0.9 the same day: the accessible-name warnings (internal/nameCheck.ts)
  'components.css': [28.5, 53.6, 'css'],
  'serupa.iife.js': [123.5, 99.0, 'share'],   // 119.4 on 31 Oct 2026, once the full icon table moved to serupa-icons.iife.js (PF1); 610.1 with it
};
// KiB, gzipped: [budget, the size it was set at]. The totals that count shared code move with the budget.
const LABELS = [2.6, 1.9];
// KiB, gzipped: PhoneInput's country table (PHONE_COUNTRIES in phone.ts, the calling codes, groupings and lengths;
// 2.4 on 26 Oct 2026). It's data, not code, and grows a row at a time, so it has its own line: a country added is
// a choice made here, not a few bytes lost in PhoneInput's own budget.
const PHONE_DATA = 2.8;
// Not made of component folders. theme.js went from 2 to 2.3 with theme-color (KW12: 2.2 when set), and to 2.4 on
// 31 Oct 2026 with the choice read again on a return from the back/forward cache (FEC6: 2.37).
const FIXED = { 'utilities.css': 168, 'base.css': 1.85, 'theme.js': 2.4, 'tokens.css': 9.6, 'serupa-icons.iife.js': 525 };   // tokens.css: 7.4 on 31 Oct 2026, once it shipped without the description comments (PF2), 8.5 on 1 Nov 2026 with a unicode-range @font-face per script (F6), 0.7 KiB that saves 240 KiB of font on an English page; 8.7 the same day with the four Inter Fallback faces (144), so text doesn't move when Inter arrives; 9.0 the same day with the line heights and CJK fonts by lang (143); 9.6 the same day with the opt-in data-type-scale="fluid" axis (22); serupa-icons.iife.js: 492.9 the same day, every Material Symbol, loaded only when a plain page names one outside the everyday set (PF1)
// KiB as shipped (woff2 is compressed already). Since F6 (1 Nov 2026) tokens.css points at Inter split by script
// (tools/fonts/subset.py), so an English page downloads the latin files: 103.3 and 113.2 KiB, against 344 and 379
// for the whole fonts, which still ship for a page that links them itself.
const FONTS = { 'fonts/InterVariable-latin.woff2': 110, 'fonts/InterVariable-Italic-latin.woff2': 120, 'fonts/InterVariable.woff2': 360, 'fonts/InterVariable-Italic.woff2': 395 };
// KiB, gzipped, each file on its own as a server sends it: what a first page costs, a sign-in form (STARTER_PAGE)
// with tokens.css, base.css, bundle.css trimmed by serupa-purge --components to what the page uses, and the
// JavaScript of Button, Field and Input (29.5 on 31 Oct 2026: 7.4 + 1.3 + 9.9 of CSS, 10.8 of JavaScript). The
// number to watch when shared code or the base styles grow, since no single component's budget sees it.
const STARTER = 32;   // 30.8 on 1 Nov 2026, once tokens.css had a unicode-range @font-face per script (F6)
const STARTER_PAGE = `import { Button, Field, Input } from 'serupa-ds';
export function SignIn() {
  return (
    <main className="mx-auto max-w-sm p-6 flex flex-col gap-4">
      <h1 className="type-2xl">Sign in</h1>
      <Field label="Email"><Input type="email" autoComplete="email" /></Field>
      <Field label="Password"><Input type="password" autoComplete="current-password" /></Field>
      <Button type="submit" className="w-full mt-2">Sign in</Button>
      <p className="text-center">No account yet?</p>
    </main>
  );
}
`;
// KiB, gzipped: Button bundled by a build that doesn't split dynamic imports (DM1), so the icon set drawn by name
// comes along (512.7 on 25 Oct 2026). Icon's README and Getting started say so; this keeps the number in sight.
// 550 on 1 Nov 2026 (548.5): the table is now 32 parts (I1), and a build that inlines them wraps each part and the
// re-exports in its own module helpers. A build that splits loads one part of about 25 KiB instead of the table.
const NO_SPLIT = 550;

const DIR = path.join(HERE, 'baseline-size');
const COMP = path.join(PROJECT, 'src', 'components');
const folders = fs.readdirSync(COMP).filter((n) => fs.statSync(path.join(COMP, n)).isDirectory()).sort();
const KEYS = ['alone', 'share', 'css'];
// "share" is the difference of two gzipped builds, so it moves when any other code changes: one unrelated edit
// moved other folders' shares by up to 20 B (26 Oct 2026), and a few merges in a day add up. A share is over its
// budget only past this many bytes, so merges that each passed don't turn main red together by "0.0 KiB" (SZ2).
// "alone" and "css" measure only what the folder pulls in, so they don't move with other folders and get no margin.
const SHARE_NOISE = 64;

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const br = (buf) => zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
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
  alone: await bundled(pick(names[n])),
  share: whole - await bundled(pick(all.filter((x) => !names[n].includes(x)))),
  css: cssWhole - cssWithout(n),
}])));

const kib = (n) => (n / 1024).toFixed(1);
// How far over: in bytes under 0.1 KiB, where kib() would print "0.0".
const over = (n) => (n < 102.4 ? `${Math.ceil(n)} B` : `${kib(n)} KiB`);
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
const size = { 'All components (index.js)': whole }, brotli = {};
for (const f of ['components.css', 'utilities.css', 'bundle.css', 'base.css', 'theme.js', 'serupa.iife.js', 'serupa-icons.iife.js']) { size[f] = file(f); brotli[f] = br(fs.readFileSync(path.join(PROJECT, 'dist', f))); }
const tokensCss = fs.readFileSync(path.join(PROJECT, 'tokens.css'));
size['tokens.css'] = gz(tokensCss); brotli['tokens.css'] = br(tokensCss);

// The starter page: serupa-purge reads sources from files, so the page goes in a scratch folder for it.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-size-'));
fs.writeFileSync(path.join(scratch, 'SignIn.tsx'), STARTER_PAGE);
const manifest = JSON.parse(fs.readFileSync(path.join(PROJECT, 'dist', 'components.json'), 'utf8'));
const used = usedClasses([scratch], manifest.runtimeUtilities);
fs.rmSync(scratch, { recursive: true, force: true });
const trimmed = Buffer.from(purge(fs.readFileSync(path.join(PROJECT, 'dist', 'bundle.css'), 'utf8'), used, unusedComponentClasses(manifest, used)) + '\n');
const starterJs = await build(pick(['Button', 'Field', 'Input']), [lazy]);
const starterParts = [tokensCss, fs.readFileSync(path.join(PROJECT, 'dist', 'base.css')), trimmed, starterJs];
const starter = starterParts.reduce((t, b) => t + gz(b), 0);

const rows = Object.entries(BUDGET).map(([name, budget]) => ({ name, now: size[name], budget }));
if (process.env.GITHUB_STEP_SUMMARY) {
  const brCell = (name) => (name in brotli ? `${kib(brotli[name])} KiB` : '');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Size (gzipped; Brotli for reference)\n\n| | Size | Brotli | Budget | |\n| --- | ---: | ---: | ---: | --- |\n${rows.map((r) => `| ${r.name} | ${kib(r.now)} KiB | ${brCell(r.name)} | ${r.budget} KiB | ${r.now <= r.budget * 1024 ? 'ok' : '**over**'} |`).join('\n')}\n| Starter page | ${kib(starter)} KiB | ${kib(starterParts.reduce((t, b) => t + br(b), 0))} KiB | ${STARTER} KiB | ${starter <= STARTER * 1024 ? 'ok' : '**over**'} |\n`);
}
const totals = rows.map((r) => ({
  name: `${r.name}: ${kib(r.now)} KiB gzipped, within ${r.budget} KiB`,
  // Under 1 KiB means it wasn't measured (a budget number pasted in place of the measurement), not that it's tiny.
  ok: r.now <= r.budget * 1024 && r.now >= 1024,
  detail: r.now < 1024 ? 'not measured: its line in `size` must measure the build, not repeat the budget'
    : `${over(r.now - r.budget * 1024)} over; ${r.name in FIXED ? 'if the growth is worth it, raise its budget in tools/test/size.mjs' : 'the shared code grew (each component is held to its own budget): if that is worth it, raise its line in TOTALS in tools/test/size.mjs'}`,
}));
for (const [f, budget] of Object.entries(FONTS)) {
  const bytes = fs.statSync(path.join(PROJECT, f)).size;
  totals.push({ name: `${f}: ${kib(bytes)} KiB, within ${budget} KiB`, ok: bytes <= budget * 1024,
    detail: `${over(bytes - budget * 1024)} over; a bigger font is a slower first paint for every page: if it's worth it, raise FONTS in tools/test/size.mjs` });
}
totals.push({ name: `Starter page (sign-in form: tokens.css, base.css, bundle.css trimmed to it, Button, Field and Input): ${kib(starter)} KiB gzipped, within ${STARTER} KiB`,
  // Under 8 KiB means part of it went missing (the trim kept nothing, or the components didn't bundle).
  ok: starter <= STARTER * 1024 && starter >= 8 * 1024,
  detail: starter < 8 * 1024 ? 'not measured: the trimmed CSS or the components came out nearly empty' : `${over(starter - STARTER * 1024)} over: a first page got heavier (tokens, base styles, shared code or one of the three); if that's worth it, raise STARTER in tools/test/size.mjs` });
const noSplit = gz(await build(pick(['Button']), []));
totals.push({ name: `Button in a build without code splitting (the icon set comes along): ${kib(noSplit)} KiB gzipped, within ${NO_SPLIT} KiB`,
  ok: noSplit <= NO_SPLIT * 1024 && noSplit > 100 * 1024,
  detail: noSplit <= 100 * 1024 ? 'the icon set no longer comes along: lower NO_SPLIT in tools/test/size.mjs and update Icon\'s README and Getting started'
    : `${over(noSplit - NO_SPLIT * 1024)} over: the icons drawn by name grew; if that's worth it, raise NO_SPLIT in tools/test/size.mjs` });
totals.push({ name: `Built-in label text (enLabels): ${kib(labels)} KiB gzipped, within ${LABELS[0]} KiB`, ok: labels <= LABELS[0] * 1024 && labels >= 512,
  detail: labels < 512 ? 'not measured: enLabels should bundle every folder\'s labels.ts' : `${over(labels - LABELS[0] * 1024)} over; if the words are worth it, raise LABELS in tools/test/size.mjs (and its second number to the size now)` });
const phoneData = gz((await esbuild.build({ stdin: { contents: "export { PHONE_COUNTRIES } from './src/components/PhoneInput/phone.ts';", resolveDir: PROJECT, loader: 'ts' }, bundle: true, minify: true, write: false, format: 'esm', logLevel: 'silent' })).outputFiles[0].contents);
totals.push({ name: `PhoneInput's country table (PHONE_COUNTRIES): ${kib(phoneData)} KiB gzipped, within ${PHONE_DATA} KiB`, ok: phoneData <= PHONE_DATA * 1024 && phoneData >= 1024,
  detail: phoneData < 1024 ? 'not measured: the table should bundle from src/components/PhoneInput/phone.ts' : `${over(phoneData - PHONE_DATA * 1024)} over; if the countries are worth it, raise PHONE_DATA in tools/test/size.mjs` });
const LABEL = { alone: 'imported alone', share: 'adds to the whole package', css: 'adds to components.css' };
const own = folders.flatMap((n) => (budgets[n]
  ? KEYS.map((k) => ({ name: `${n} ${LABEL[k]}: ${kib(measured[n][k])} KiB, within ${budgets[n][k]} KiB`, ok: measured[n][k] <= budgets[n][k] * 1024 + (k === 'share' ? SHARE_NOISE : 0),
    detail: `${over(measured[n][k] - budgets[n][k] * 1024)} over; if the growth is worth it, raise "${k}" in tools/test/baseline-size/${n}.json` }))
  : [{ name: `${n} has size budgets`, ok: false, detail: `run node tools/test/size.mjs --update ${n} and commit tools/test/baseline-size/${n}.json` }]));
const orphans = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => !folders.includes(f.replace(/\.json$/, ''))) : [];
done(report('Size', [...totals, ...own, { name: 'every size budget file belongs to a component folder', ok: !orphans.length, detail: orphans.join(', ') }]));
