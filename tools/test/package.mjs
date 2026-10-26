// The package as a project installs it (npm run build first): every file in package.json's exports exists,
// the components import as ES modules and render on the server (Next.js, Remix) with no browser globals,
// the types build, and bundle.css is exactly components.css followed by utilities.css.
//   node tools/test/package.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { HERE, PROJECT, done, read, report } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const pkg = JSON.parse(read('package.json'));

// 0. Nothing publishes to a registry until Diki picks the final name: projects install releases from GitHub.
t('package.json is private and has no publishConfig, so npm publish refuses', pkg.private === true && !('publishConfig' in pkg), `private: ${pkg.private}, publishConfig: ${JSON.stringify(pkg.publishConfig)}`);
// Every component is built by tools in devDependencies, so a project installs nothing else (J7).
t('package.json has no dependencies (React is a peer dependency; everything else is bundled)', !Object.keys(pkg.dependencies || {}).length && !Object.keys(pkg.optionalDependencies || {}).length, JSON.stringify({ ...pkg.dependencies, ...pkg.optionalDependencies }));
// npm runs the build as "prepare", so it reports on stderr: npm pack --json then prints only its JSON.
const builder = read('tools/build/build.mjs');
t('the build writes its progress to stderr, never stdout (npm pack --json stays JSON)', !/console\.log\(|stdio: 'inherit'/.test(builder));

// 1. exports
const targets = [];
for (const [k, v] of Object.entries(pkg.exports)) for (const f of typeof v === 'string' ? [v] : Object.values(v)) if (!f.includes('*')) targets.push([k, f]);
const absent = targets.filter(([, f]) => !fs.existsSync(path.join(PROJECT, f)));
t('every file package.json exports exists', !absent.length, absent.map(([k, f]) => `${k} → ${f}`).join(', '));
const index = read('src/index.ts');
// The package's own exports, and every component folder's (src/generated/globals.ts, built from their index.ts files).
const exported = [...index.matchAll(/^export \{ ([^}]*) \};/gm), ...read('src/generated/globals.ts').matchAll(/^import \{ ([^}]*) \}/gm)].flatMap((m) => m[1].split(', '));
const typed = new Set([...index.matchAll(/(\w+): typeof \w+;/g), ...read('src/generated/globals.ts').matchAll(/(\w+): typeof \w+;/g)].map((m) => m[1]));
const browserTs = read('src/browser.ts');
// browser.ts puts the whole package on window.Serupa, so nothing can be left out of it by hand.
const bundlesAll = /import \* as Serupa from "\.\/index";/.test(browserTs) && /Object\.assign\(window\.Serupa \|\| \{\}, Serupa\)/.test(browserTs);
const untyped = exported.filter((n) => !typed.has(n));
t('every export is on window.Serupa (src/browser.ts) and in its type (src/index.ts)', !untyped.length && bundlesAll, `not typed: ${untyped.join(', ')}; ${bundlesAll ? '' : 'browser.ts must assign everything from ./index to window.Serupa'}`);
t('react and react-dom are peer dependencies (one React in the app)', pkg.peerDependencies && pkg.peerDependencies.react && pkg.peerDependencies['react-dom'] && !(pkg.dependencies || {}).react);
// dist/index.d.ts imports React's types: a TypeScript project needs @types/react, a JavaScript one doesn't.
const typeImports = [...new Set([...read('dist/index.d.ts').matchAll(/from ['"]([^'"./][^'"]*)['"]/g)].map((m) => m[1]))];
const untypedPeers = typeImports.filter((m) => !pkg.peerDependencies?.[`@types/${m}`] || !pkg.peerDependenciesMeta?.[`@types/${m}`]?.optional);
t('every package dist/index.d.ts imports types from has its @types package as an optional peer', typeImports.length && !untypedPeers.length, `${untypedPeers.map((m) => `@types/${m}`).join(', ')} (imports: ${typeImports.join(', ')})`);

// A project's Node only has to run what the package ships: engines is the floor for that, devEngines (Node 26)
// is for working in this repo. CommonJS code that require()s the package (Node 22.12+ loads ES modules that way)
// matches "default", not "import".
t('engines.node is ">=22" and devEngines asks for Node 26 to work on the repo', pkg.engines?.node === '>=22' && pkg.devEngines?.runtime?.version === '>=26', JSON.stringify({ engines: pkg.engines, devEngines: pkg.devEngines }));
const noDefault = Object.entries(pkg.exports).filter(([, v]) => typeof v === 'object' && v.import && v.default !== v.import).map(([k]) => k);
t('every export with an "import" condition has the same file as "default", so require(esm) finds it', !noDefault.length, noDefault.join(', '));

// 2. server rendering: no window, document or navigator while importing and rendering
for (const g of ['window', 'document']) t(`no ${g} in Node`, typeof globalThis[g] === 'undefined');
let D = null, err = null;
try { D = await import(pathToFileURL(path.join(PROJECT, 'dist', 'index.js')).href); } catch (e) { err = e; }
t('dist/index.js imports in Node (no browser globals at load time)', D, err && err.stack);
if (D) {
  const React = (await import('react')).default;
  const { renderToString } = await import('react-dom/server');
  const h = React.createElement;
  const warnings = [];
  const keep = [console.error, console.warn];
  console.error = console.warn = (...a) => warnings.push(a.map(String).join(' ').split('\n')[0]);
  // One file per component in tools/test/ssr/, so a pull request that adds a component adds a file, not a line here.
  const SSR = path.join(HERE, 'ssr');
  const cases = {};
  for (const f of fs.readdirSync(SSR).filter((f) => f.endsWith('.mjs')).sort()) Object.assign(cases, (await import(pathToFileURL(path.join(SSR, f)).href)).default({ h, D }));
  // Every component the package exports renders in one of the cases in tools/test/ssr/ (as the case or a part inside it), so a
  // new component can't skip this check.
  const seen = new Set();
  const walk = (el) => {
    if (Array.isArray(el)) return el.forEach(walk);
    if (!el || typeof el !== 'object' || !el.props) return;
    for (const [k, v] of Object.entries(D)) if (v === el.type) seen.add(k);
    for (const v of Object.values(el.props)) walk(v);
  };
  Object.values(cases).forEach(walk);
  const unrendered = Object.keys(D).filter((k) => /^[A-Z]/.test(k) && !seen.has(k));
  t('every component the package exports is server-rendered here', !unrendered.length, `add tools/test/ssr/<Name>.mjs for: ${unrendered.join(', ')}`);
  for (const [name, el] of Object.entries(cases)) {
    let html = '', e = null;
    try { html = renderToString(el); } catch (x) { e = x; }
    t(`${name} renders on the server`, !e && /class="dk-/.test(html), e ? e.message : html.slice(0, 160));
  }
  [console.error, console.warn] = keep;
  // Several cases write numbers or dates without a locale: Serupa says once that the HTML is en-US until hydration.
  const serverLocale = warnings.filter((w) => w.startsWith('Serupa: rendered on the server without a locale'));
  t('a component that writes dates or numbers on the server without a locale warns once, naming SerupaProvider locale (AG1)', serverLocale.length === 1 && serverLocale[0].includes('<SerupaProvider locale>'), `${serverLocale.length} warnings`);
  // …and says nothing when the provider sets one (a fresh process, so the warning hasn't been given yet).
  const withLocale = spawnSync(process.execPath, ['--input-type=module', '-e', `const w = []; console.warn = (m) => w.push(m); const React = (await import('react')).default; const { renderToString } = await import('react-dom/server'); const D = await import(${JSON.stringify(pathToFileURL(path.join(PROJECT, 'dist', 'index.js')).href)}); const h = React.createElement; renderToString(h(D.SerupaProvider, { locale: 'id-ID' }, h(D.DatePicker, { 'aria-label': 'Day' }), h(D.NumberInput, { 'aria-label': 'Qty', defaultValue: 1 }))); process.stdout.write(String(w.length));`], { encoding: 'utf8', cwd: PROJECT });
  t('…and doesn\'t warn when SerupaProvider sets the locale', withLocale.stdout === '0', withLocale.stdout + withLocale.stderr.slice(0, 200));
  const others = warnings.filter((w) => !serverLocale.includes(w));
  t('no React warnings while rendering on the server', !others.length, others.slice(0, 3).join(' | '));
  // RelativeTime on a long-running server: each request says how long ago it is then, not when the process started.
  const realNow = Date.now, start = realNow(), stamp = start - 5 * 60e3;
  const ago = () => renderToString(h(D.RelativeTime, { date: stamp, locale: 'en-US' })).replace(/<[^>]*>/g, '');
  let first = '', later = '';
  try { first = ago(); Date.now = () => start + 2 * 3600e3; later = ago(); } finally { Date.now = realNow; }
  t('RelativeTime on the server: a request two hours later says "2 hours ago", not the first request\'s words', first === '5 minutes ago' && later === '2 hours ago', `${first} | ${later}`);
  // The date components format on the server too: the picked day is selected, and the field shows it in the locale's format.
  const ssrCase = async (n) => (await import(path.join(HERE, 'ssr', `${n}.mjs`))).default({ h, D })[n];
  const cal = renderToString(await ssrCase('Calendar')), picker = renderToString(await ssrCase('DatePicker'));
  t('Calendar and DatePicker on the server: 18 October 2026 is selected and typed as 18/10/2026 (en-GB)',
    /<td aria-selected="true"[^>]*><button[^>]*aria-label="Sunday, 18 October 2026"/.test(cal) && picker.includes('value="18/10/2026"'), `${(cal.match(/<td aria-selected="true".{0,120}/) || ['nothing selected'])[0]} | ${(picker.match(/value="[^"]*"/) || ['no value'])[0]}`);
  // CheckboxGroup's boxes register as they mount, which never happens on the server: select-all counts its sibling
  // Checkboxes instead, so with defaultValue ['a'] of a and b it's enabled and mixed (a dash) from the first paint.
  const all = (renderToString(await ssrCase('CheckboxGroup')).match(/<label[^>]*>.*?<\/label>/) || [''])[0];
  t('CheckboxGroup on the server: select-all is enabled and mixed when defaultValue checks some boxes',
    !/ disabled=""/.test(all) && !/ checked=""/.test(all) && /data-icon="remove"/.test(all) && !/dk-checkbox--disabled/.test(all), all.slice(0, 400));
  t('version matches package.json', D.version === pkg.version, D.version);
  // base.css and theme.js say __VERSION__ in src/, which the build replaces (tools/build/build.mjs).
  const unstamped = ['dist/base.css', 'dist/theme.js'].filter((f) => read(f).includes('__VERSION__') || !read(f).includes(`Serupa v${pkg.version} `));
  t('dist/base.css and dist/theme.js carry package.json\'s version (stamped at build)', !unstamped.length && read('dist/theme.js').includes(`version = "${pkg.version}"`), unstamped.join(', '));
  // Server-rendered apps paste theme.js into an inline <script> to avoid a flash of the wrong theme: a closing script tag
  // anywhere in it (a comment included) ends that script early, and an HTML comment opener changes how the rest is read.
  const inlineBreakers = ['</script', '<!--'].filter((x) => read('dist/theme.js').toLowerCase().includes(x));
  t('dist/theme.js works pasted into an inline <script>: no closing script tag or HTML comment opener in it', !inlineBreakers.length, inlineBreakers.join(', '));
  // Icons: each component imports the icons it draws, so they draw on the server. A name drawn as a string loads in
  // the browser (the components' icons from a small chunk, the rest from the full set), so on the server it's an empty box.
  const iconHtml = (props) => renderToString(h(D.Icon, props));
  t('a component draws its own icons on the server (Checkbox\'s check)', /<path d="/.test(renderToString(h(D.Checkbox, { defaultChecked: true, 'aria-label': 'Done' }))));
  t('a name ("close", "sports_cricket") keeps its empty box on the server until it loads in the browser', !/<svg/.test(iconHtml({ name: 'close' })) && !/<svg/.test(iconHtml({ name: 'sports_cricket' })), iconHtml({ name: 'close' }));
  // index.js and every module it imports (dist/js/), as a bundler puts them together, without the full icon set.
  const indexJs = esbuild.buildSync({ entryPoints: [path.join(PROJECT, 'dist', 'index.js')], bundle: true, write: false, format: 'esm', external: ['react', 'react-dom', './material/icons.js', './material/named.js'], logLevel: 'silent' }).outputFiles[0].text;
  t('index.js leaves the full icon set out (loaded on demand) and stays under 150 KB gzipped', !indexJs.includes('"sports_cricket"') && zlib.gzipSync(indexJs).length < 150 * 1024, `${Math.round(zlib.gzipSync(indexJs).length / 1024)} KB`);
  // Tree-shaking: a bundler keeps only what a project imports. Every component is made by component() or named()
  // with a /* @__PURE__ */ mark and nothing else runs at the top of a module, so Divider alone is a few hundred bytes.
  const alone = (name) => zlib.gzipSync(esbuild.buildSync({ stdin: { contents: `import { ${name} } from './dist/index.js'; console.log(${name});`, resolveDir: PROJECT }, bundle: true, minify: true, write: false, format: 'esm', external: ['react', 'react-dom', './material/icons.js', './material/named.js'], logLevel: 'silent' }).outputFiles[0].contents).length;
  const shaken = { Divider: alone('Divider'), toast: alone('toast') };
  t('a bundler drops the components a project doesn\'t import (Divider or toast alone: under 2 KB gzipped)', shaken.Divider < 2048 && shaken.toast < 2048, JSON.stringify(shaken));
  // …and the icons they don't draw: Dialog keeps its close icon, Button keeps none.
  const code = (name) => esbuild.buildSync({ stdin: { contents: `import { ${name} } from './dist/index.js'; console.log(${name});`, resolveDir: PROJECT }, bundle: true, write: false, format: 'esm', external: ['react', 'react-dom', './material/icons.js', './material/named.js'], logLevel: 'silent' }).outputFiles[0].text;
  const drawn = (js) => [...js.matchAll(/name: "([a-z0-9_]+)",\s*d: "/g)].map((m) => m[1]);
  const icons = { Button: drawn(code('Button')), Dialog: drawn(code('Dialog')) };
  t('a bundler keeps only the icons a component draws (Button: none, Dialog: close)', !icons.Button.length && icons.Dialog.join() === 'close', JSON.stringify(icons));
  // React Server Components: the interactive components are client modules ("use client"), the rest render on the
  // server, and the helpers run there (tools/test/server-components/render.mjs).
  const rsc = spawnSync(process.execPath, ['--conditions=react-server', path.join(HERE, 'server-components', 'render.mjs'), path.join(PROJECT, 'dist')], { encoding: 'utf8' });
  let sc = null;
  try { sc = JSON.parse(rsc.stdout); } catch { /* reported below */ }
  t('Server Components: every component without "use client" renders with React\'s server build, and the helpers run there', sc && !sc.errors.length && sc.server.length > 0 && sc.helpers.buttonClass === 'dk-btn dk-btn--outline dk-btn--size-md' && sc.helpers.formatFileSize === '1.5 KB', sc ? JSON.stringify(sc.errors) : rsc.stderr.slice(0, 500));
  // Each module that needs the browser (state, effects, context, event handlers) says so with "use client".
  const clientOnly = /\bReact\.(useState|useEffect|useLayoutEffect|useReducer|useRef|useContext|useSyncExternalStore|useImperativeHandle|createContext)\b|\buseFieldControl\(|\buseSerupa\(|\buseLocale\(|\bon[A-Z]\w*=\{/;
  const unmarked = fs.readdirSync(path.join(PROJECT, 'src', 'components'), { recursive: true }).map(String).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx$/.test(f))
    .filter((f) => { const src = read(`src/components/${f}`); return clientOnly.test(src) && !/^"use client";/.test(src); });
  t('every component module that uses state, effects, context or event handlers starts with "use client"', !unmarked.length, unmarked.join(', '));
  t('buttonClass and configure are exported', D.buttonClass({ variant: 'outline' }) === 'dk-btn dk-btn--outline dk-btn--size-md' && typeof D.configure === 'function');
}

// 3. types and CSS
const dts = fs.existsSync(path.join(PROJECT, 'dist', 'index.d.ts')) ? read('dist/index.d.ts') : '';
const missingTypes = ['Badge', 'Button', 'Checkbox', 'Field', 'Icon', 'Input', 'Loader', 'Radio', 'RadioGroup', 'Select', 'Switch', 'Textarea', 'ButtonProps', 'InputProps', 'SerupaConfig', 'CustomIconName']
  .filter((n) => !new RegExp(`\\b${n}\\b`).test(dts));
t('dist/index.d.ts declares every component and its props', dts && !missingTypes.length, missingTypes.join(', '));
// Each file starts with its banner and the cascade layer order; the rest is the styles.
const body = (f) => read(f).replace(/^\/\*![^\n]*\*\/\n@layer [^;]*;\n/, '');
t('bundle.css = components.css + utilities.css', body('dist/bundle.css') === body('dist/components.css') + body('dist/utilities.css'));
t('components.css holds no utility classes (only dk-* and the keyframes they use)', !/^\.(?!dk-)[a-z]/m.test(body('dist/components.css').replace(/\/\*[\s\S]*?\*\//g, '')));
t('the old bundle.js alias is gone (removed in 8.0.0)', !fs.existsSync(path.join(PROJECT, 'dist', 'bundle.js')));

// 4. The files the package ships (npm pack): the fixed list in baseline-package.txt, plus a module and its source map
// in dist/js/ for each module in src/ (not tests or stories) and a tokens file in design-tokens/components/ for each
// component's, so a new file can't ship (or one vanish) unreviewed, and a component pull request edits no shared list.
const pack = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: PROJECT, encoding: 'utf8', shell: process.platform === 'win32' });
const shipped = pack.status === 0 ? new Set(JSON.parse(pack.stdout)[0].files.map((f) => f.path)) : null;
// Built on their own, not as modules: the browser scripts' entries, and types only.
const ENTRIES = new Set(['browser', 'browser-icons', 'theme-types']);
const modules = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map((f) => String(f).split(path.sep).join('/'))
  .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$|\.d\.ts$/.test(f)).map((f) => f.replace(/\.tsx?$/, '')).filter((f) => !ENTRIES.has(f));
const tokenFiles = fs.readdirSync(path.join(PROJECT, 'src', 'components'), { recursive: true }).map(String).filter((f) => f.endsWith('.tokens.json')).map((f) => `design-tokens/components/${path.basename(f)}`);
const expected = new Set([...read('tools/test/baseline-package.txt').split('\n').filter(Boolean), ...modules.flatMap((m) => [`dist/js/${m}.js`, `dist/js/${m}.js.map`]), ...tokenFiles]);
const extra = shipped ? [...shipped].filter((f) => !expected.has(f)) : [], gone = shipped ? [...expected].filter((f) => !shipped.has(f)) : [];
t('npm pack ships exactly the expected files (tools/test/baseline-package.txt, a module per src/ file, a tokens file per component)', shipped && !extra.length && !gone.length,
  shipped ? `ships unexpectedly: ${extra.slice(0, 8).join(', ') || 'none'}; missing: ${gone.slice(0, 8).join(', ') || 'none'}. If intended, edit tools/test/baseline-package.txt (or package.json "files")` : pack.stderr.slice(0, 300));

done(report('Package', R));
