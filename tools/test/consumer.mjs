// The package as a project installs it, on the Node it runs (EZ1): package.json allows Node 22 and later, while the
// repository builds on Node 26, so CI runs this on Node 22 and 24 too. It packs the built package as a release ships
// it, installs the tarball with React into an empty project, then from that project imports serupa-ds and
// serupa-ds/icons, finds each CSS file, theme.js and the browser script by its export, and server-renders every case
// in tools/test/ssr/. Then it installs it with Preact and renders and mounts every case there. Needs the build
// (npm run build) and the network (npm install), so the checks project skips it.
//   node tools/test/consumer.mjs
//   node tools/test/consumer.mjs --release   the GitHub release of package.json's version instead (D5), by the URL the
//                                             README's install line gives, after the Release workflow has made it
//   node tools/test/consumer.mjs --react canary   with React's canary (or any version or tag npm knows) (J4)
// Only Node's own modules here: on Node 22 the repository's dependencies aren't installed (npm ci asks for Node 26).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..', '..');
const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args, cwd) => {
  const r = spawnSync(npm, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.log(`FAIL  npm ${args.join(' ')}\n${r.stdout}${r.stderr}`); process.exit(1); }
  return r.stdout;
};
// --release: the tarball attached to this version's GitHub release, as the README's install line has a project fetch
// it, so a release that went out broken (a file left out, a bad package.json) fails here and not in someone's app.
// The checkout is the tag's, so the cases in tools/test/ssr/ are the ones that version shipped with.
const release = process.argv.includes('--release');
const repo = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-consumer-'));
let tarball;
if (release) tarball = `${repo}/releases/download/v${pkg.version}/${pkg.name}-${pkg.version}.tgz`;
else {
  if (!fs.existsSync(path.join(PROJECT, 'dist', 'index.js'))) { console.log('FAIL  nothing built: run npm run build first'); process.exit(1); }
  // The package exactly as a release ships it (as in package-lint.mjs): the files package.json lists, and a
  // package.json without scripts, devDependencies or devEngines (as tools/publish.mjs ships it: devEngines asks for
  // the Node the repository builds with, and npm pack refuses to run on an older one).
  const dir = path.join(tmp, 'package');
  for (const f of pkg.files) if (fs.existsSync(path.join(PROJECT, f))) fs.cpSync(path.join(PROJECT, f), path.join(dir, f), { recursive: true });
  const shipped = { ...pkg };
  delete shipped.scripts;
  delete shipped.devDependencies;
  delete shipped.devEngines;
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(shipped, null, 2) + '\n');
  tarball = path.join(tmp, JSON.parse(run(['pack', '--json', '--pack-destination', tmp], dir))[0].filename);
}

// An empty project with the tarball and the React the repository tests with.
const app = path.join(tmp, 'app');
fs.mkdirSync(app);
fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }) + '\n');
// A release's tag holds the package.json it ships, without devDependencies: then the React its peers allow.
// --react canary (J4): React's next version instead, as the nightly runs it, so a change coming in React shows up here
// before it ships. The Preact project is the same either way.
const dep = (name) => pkg.devDependencies?.[name] ?? pkg.peerDependencies[name];
const reactArg = process.argv.indexOf('--react');
const reactVersion = reactArg > 0 ? process.argv[reactArg + 1] : null;
run(['install', '--no-audit', '--no-fund', '--ignore-scripts', ...(reactVersion ? ['--legacy-peer-deps'] : []), tarball, `react@${reactVersion ?? dep('react')}`, `react-dom@${reactVersion ?? dep('react-dom')}`], app);

// Runs inside the project, so serupa-ds resolves from its node_modules as in any app.
const SSR = path.join(HERE, 'ssr');
const fixtures = fs.readdirSync(SSR).filter((f) => f.endsWith('.mjs')).sort().map((f) => pathToFileURL(path.join(SSR, f)).href);
const FILES = ['serupa-ds/tokens.css', 'serupa-ds/base.css', 'serupa-ds/bundle.css', 'serupa-ds/components.css', 'serupa-ds/utilities.css', 'serupa-ds/utilities-extra.css', 'serupa-ds/theme.js', 'serupa-ds/serupa.iife.js', 'serupa-ds/package.json'];
fs.writeFileSync(path.join(app, 'check.mjs'), `
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const R = [], t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
t('React ' + React.version + ' is installed', ${JSON.stringify(reactVersion ?? '')} !== 'canary' || React.version.includes('canary'), React.version);
let D, icons;
try { D = await import('serupa-ds'); t('import "serupa-ds"', Object.keys(D).length > 100, Object.keys(D).length + ' exports'); } catch (e) { t('import "serupa-ds"', false, e.stack); }
try { icons = await import('serupa-ds/icons'); t('import "serupa-ds/icons"', Object.keys(icons).length > 100, Object.keys(icons).length + ' exports'); } catch (e) { t('import "serupa-ds/icons"', false, e.stack); }
const installed = JSON.parse(fs.readFileSync(fileURLToPath(import.meta.resolve('serupa-ds/package.json')), 'utf8')).version;
t('the installed version is ${pkg.version}', installed === ${JSON.stringify(pkg.version)}, 'installed ' + installed);
for (const f of ${JSON.stringify(FILES)}) {
  let file; try { file = fileURLToPath(import.meta.resolve(f)); } catch (e) { t(f + ' resolves', false, e.message); continue; }
  t(f + ' resolves to a file', fs.statSync(file).size > 0, file);
}
if (D) {
  const h = React.createElement, cases = {};
  for (const f of ${JSON.stringify(fixtures)}) Object.assign(cases, (await import(f)).default({ h, D }));
  const failed = [];
  for (const [name, el] of Object.entries(cases)) { try { if (!renderToString(el)) failed.push(name + ': empty'); } catch (e) { failed.push(name + ': ' + e.message); } }
  t('every case in tools/test/ssr/ renders on the server (' + Object.keys(cases).length + ')', Object.keys(cases).length > 50 && !failed.length, failed.join('\\n      '));
}
process.stdout.write(JSON.stringify(R));
`);
const check = (cwd) => {
  const r = spawnSync(process.execPath, ['check.mjs'], { cwd, encoding: 'utf8' });
  try { return JSON.parse(r.stdout); } catch { console.log(`FAIL  the check in the ${path.basename(cwd)} project didn't finish\n${r.stdout}${r.stderr}`); process.exit(1); }
};
const results = check(app);

// The same package in a Preact project (123): react and react-dom are @preact/compat under their names, as Preact's
// guide sets them up, installed with --legacy-peer-deps since compat says it's React 18. Every case renders on the
// server (preact-render-to-string, which compat's react-dom/server uses), then mounts in a DOM (happy-dom) with hooks
// and effects running, so a React-only export (useFormStatus) or a hook compat lacks fails here. A case may leave its
// root empty: Toaster renders nothing until a toast.
const preact = path.join(tmp, 'preact');
fs.mkdirSync(preact);
fs.writeFileSync(path.join(preact, 'package.json'), JSON.stringify({ name: 'consumer-preact', private: true, type: 'module' }) + '\n');
run(['install', '--no-audit', '--no-fund', '--ignore-scripts', '--legacy-peer-deps', tarball, 'preact@11', 'react@npm:@preact/compat@18', 'react-dom@npm:@preact/compat@18', 'preact-render-to-string@6', 'happy-dom@21'], preact);
fs.writeFileSync(path.join(preact, 'check.mjs'), `
const R = [], t = (name, ok, detail) => R.push({ name: 'Preact: ' + name, ok: !!ok, detail });
const { Window } = await import('happy-dom');
const win = new Window({ url: 'http://localhost/' });
for (const k of Object.getOwnPropertyNames(win)) if (!(k in globalThis)) { try { const v = win[k]; globalThis[k] = typeof v === 'function' && /^[a-z]/.test(k) ? v.bind(win) : v; } catch {} }
const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
const { createRoot } = await import('react-dom/client');
const { flushSync } = await import('react-dom');
let D;
try { D = await import('serupa-ds'); t('import "serupa-ds"', Object.keys(D).length > 100, Object.keys(D).length + ' exports'); } catch (e) { t('import "serupa-ds"', false, e.message); }
if (D) {
  const h = React.createElement, cases = {};
  for (const f of ${JSON.stringify(fixtures)}) Object.assign(cases, (await import(f)).default({ h, D }));
  const n = Object.keys(cases).length, server = [], client = [];
  for (const [name, el] of Object.entries(cases)) {
    try { if (!renderToString(el)) server.push(name + ': empty'); } catch (e) { server.push(name + ': ' + e.message); }
    const root = document.createElement('div');
    document.body.append(root);
    try { const r = createRoot(root); flushSync(() => r.render(el)); r.unmount(); } catch (e) { client.push(name + ': ' + e.message); }
    root.remove();
  }
  t('every case in tools/test/ssr/ renders on the server (' + n + ')', n > 50 && !server.length, server.join('\\n      '));
  t('every case in tools/test/ssr/ mounts and unmounts in the browser (' + n + ')', n > 50 && !client.length, client.join('\\n      '));
}
await win.happyDOM.close();
process.stdout.write(JSON.stringify(R));
`);
results.push(...check(preact));
fs.rmSync(tmp, { recursive: true, force: true });
for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.name}${x.ok || !x.detail ? '' : '\n      ' + x.detail}`);
const bad = results.filter((x) => !x.ok).length;
console.log(`\nConsumer${release ? ` of the v${pkg.version} release` : ''}${reactVersion ? ` with react@${reactVersion}` : ''} on Node ${process.versions.node}: ${results.length - bad}/${results.length} passed`);
process.exit(bad ? 1 : 0);
