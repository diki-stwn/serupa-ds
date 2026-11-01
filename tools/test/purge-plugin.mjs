// serupa-ds/purge, as a project uses it (npm run build first): the Vite plugin trims bundle.css in `vite build` to
// what the serupa-purge command keeps (a used utility class stays, an unused one goes, the component styles stay)
// and leaves the app's own CSS alone; the PostCSS plugin does the same to bundle.css, to the rules a file @imports
// from it, and to nothing else, with --components and --keep working as on the command line.
//   node tools/test/purge-plugin.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { PROJECT, report, done, fail } from './lib.mjs';
import { purge, usedClasses } from '../../bin/serupa-purge.mjs';

const file = path.join(PROJECT, 'dist', 'purge.js');
if (!fs.existsSync(file)) fail('no dist/purge.js: run npm run build first');
const { serupaPurge, serupaPurgePostcss } = await import(pathToFileURL(file).href);
const BUNDLE = path.join(PROJECT, 'dist', 'bundle.css');
const bundle = fs.readFileSync(BUNDLE, 'utf8');
const runtime = JSON.parse(fs.readFileSync(path.join(PROJECT, 'dist', 'components.json'), 'utf8')).runtimeUtilities;

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
// A rule for the class, as the minified or the purged CSS writes its selector (a colon escaped: .md\:flex).
const selector = (cls) => '.' + cls.replace(/[\\:]/g, '\\$&');
const has = (css, cls) => { const s = selector(cls); let i = css.indexOf(s); while (i >= 0 && /[\w-]/.test(css[i + s.length] || '')) i = css.indexOf(s, i + 1); return i >= 0; };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-purge-plugin-'));
try {
  fs.mkdirSync(path.join(dir, 'src'));
  // The package's files by name (the build below maps serupa-ds to dist/), as a project imports them.
  fs.writeFileSync(path.join(dir, 'src', 'main.js'), 'import "serupa-ds/bundle.css";\nimport "serupa-ds/utilities-extra.css";\nimport "./app.css";\ndocument.body.className = "flex md:grid-cols-3 bg-linear-to-r from-primary"; // renders <Button>\n');
  fs.writeFileSync(path.join(dir, 'src', 'app.css'), '.my-card { color: red }\n.grid-cols-7 { color: blue }\n');
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>t</title><script type="module" src="/src/main.js"></script>');
  fs.writeFileSync(path.join(dir, 'safe.txt'), 'gap-7\n');

  // The command's result, the reference for both plugins.
  const want = purge(bundle, usedClasses([path.join(dir, 'src'), path.join(dir, 'index.html')], runtime));
  t('the reference keeps the used classes and drops an unused one', has(want, 'flex') && has(want, 'md:grid-cols-3') && !has(want, 'grid-cols-7'), want.length);

  // Vite: a production build of the page.
  const { build } = await import('vite');
  const out = await build({ root: dir, logLevel: 'silent', configFile: false, resolve: { alias: { 'serupa-ds': path.join(PROJECT, 'dist') } }, plugins: [serupaPurge({ keep: ['@safe.txt'] })], build: { outDir: path.join(dir, 'out'), write: false } });
  const css = [out].flat().flatMap((o) => o.output).filter((a) => a.fileName.endsWith('.css')).map((a) => a.source).join('\n');
  t('Vite: the build keeps the utility classes the sources use', has(css, 'flex') && has(css, 'md:grid-cols-3'), css.length);
  t('Vite: it drops one they don\'t use, and --keep\'s safelist file works', !has(css, 'grid-cols-5') && has(css, 'gap-7'), css.length);
  t('Vite: utilities-extra.css is trimmed too (from-primary stays, from-danger goes)', has(css, 'from-primary') && has(css, 'bg-linear-to-r') && !has(css, 'from-danger'), css.length);
  t('Vite: the component styles stay', has(css, 'dk-btn') && has(css, 'dk-dialog'), css.length);
  t('Vite: the app\'s own CSS is left alone, a rule named like a utility too', has(css, 'my-card') && has(css, 'grid-cols-7'), css.length);
  t('Vite: the stylesheet is about the size the command makes, not 2 MB', css.length < 400_000, `${Math.round(css.length / 1024)} KB`);
  t('Vite: the dev server is left alone (apply: "build")', serupaPurge().apply === 'build');

  // PostCSS: bundle.css itself, an app file, and an app file with bundle.css's rules @imported into it.
  const run = async (code, from, options = {}) => (await postcss([serupaPurgePostcss({ root: dir, ...options })]).process(code, { from })).css;
  const own = await run(bundle, BUNDLE);
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  t('PostCSS: bundle.css comes out as the command writes it', norm(own) === norm(want), `${own.length} vs ${want.length}`);
  const app = '.my-card { color: red }\n.grid-cols-7 { color: blue }';
  t('PostCSS: the app\'s own CSS passes through unchanged', (await run(app, path.join(dir, 'src', 'app.css'))) === app);
  const merged = postcss.parse(app, { from: path.join(dir, 'src', 'app.css') });
  merged.append(postcss.parse(bundle, { from: BUNDLE }).nodes);
  const mixed = (await postcss([serupaPurgePostcss({ root: dir })]).process(merged, { from: path.join(dir, 'src', 'app.css') })).css;
  t('PostCSS: rules @imported from bundle.css are trimmed, the importing file\'s are kept', mixed.startsWith(app) && has(mixed, 'flex') && !has(mixed, 'grid-cols-5') && mixed.length < 400_000, mixed.slice(0, 200));
  const lean = await run(bundle, BUNDLE, { components: true });
  t('PostCSS: components: true drops the components the sources never name', has(lean, 'dk-btn') && !has(lean, 'dk-dialog') && lean.length < own.length, `${lean.length} vs ${own.length}`);
  let error = '';
  try { await run(bundle, BUNDLE, { content: ['nowhere'] }); } catch (e) { error = String(e.message); }
  t('a content path that isn\'t there stops the build, saying which', error.includes('no such file or folder') && error.includes('nowhere'), error);
  const deps = (await postcss([serupaPurgePostcss({ root: dir })]).process(bundle, { from: BUNDLE })).messages;
  t('PostCSS: the sources are reported as dependencies, so a watcher rebuilds', deps.some((m) => m.type === 'dir-dependency' && m.dir === path.join(dir, 'src')) && deps.some((m) => m.type === 'dependency' && m.file === path.join(dir, 'index.html')), JSON.stringify(deps));
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
done(report('serupa-ds/purge (Vite and PostCSS plugins)', R));
