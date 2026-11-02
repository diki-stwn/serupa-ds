// The starter app's generator (bin/serupa-create.mjs, 135), without the network: the React, Vite and TypeScript it
// pins are the ones the repository tests with, the page it writes loads the stylesheets in order and has its landmarks,
// and it refuses a folder that already has files. tools/test/consumer.mjs installs and builds the app it makes.
//   node tools/test/create-app.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { VERSIONS, files } from '../../bin/serupa-create.mjs';
import { PROJECT, done, report } from './lib.mjs';

const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8'));
const drift = Object.entries(VERSIONS).filter(([name, v]) => pkg.devDependencies[name] !== v).map(([name, v]) => `${name}: ${v}, the repository has ${pkg.devDependencies[name]}`);
const out = files({ name: 'my-app', serupa: 'github:diki-stwn/serupa-ds#v1.2.3', brand: 'violet' });
const app = JSON.parse(out['package.json']);
const main = out['src/main.tsx'];
const order = ['serupa-ds/tokens.css', 'serupa-ds/base.css', 'serupa-ds/bundle.css'].map((f) => main.indexOf(f));

const bin = path.join(PROJECT, 'bin', 'serupa-create.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-create-'));
const made = spawnSync(process.execPath, [bin, path.join(tmp, 'Hello World')], { encoding: 'utf8' });
const written = fs.existsSync(path.join(tmp, 'Hello World', 'package.json')) ? JSON.parse(fs.readFileSync(path.join(tmp, 'Hello World', 'package.json'), 'utf8')) : {};
const again = spawnSync(process.execPath, [bin, path.join(tmp, 'Hello World')], { encoding: 'utf8' });
const brand = spawnSync(process.execPath, [bin, path.join(tmp, 'b'), '--brand', 'red'], { encoding: 'utf8' });
fs.rmSync(tmp, { recursive: true, force: true });

done(report('Starter app', [
  { name: 'it pins the React, Vite, TypeScript and types the repository tests with', ok: !drift.length, detail: drift.join('; ') },
  { name: 'the app installs the given serupa-ds and builds, checks types and serves with Vite', ok: app.dependencies['serupa-ds'] === 'github:diki-stwn/serupa-ds#v1.2.3' && app.scripts.build === 'vite build' && app.scripts.typecheck === 'tsc --noEmit' && app.scripts.dev === 'vite', detail: out['package.json'] },
  { name: 'the page sets the brand and mode, and the stylesheets load tokens, base, then bundle', ok: out['index.html'].includes('<html lang="en" data-brand="violet" data-mode="auto">') && order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), detail: main },
  { name: 'the app has a skip link, a main landmark it targets, one h1, and a labelled field', ok: /<SkipLink \/>/.test(out['src/App.tsx']) && /as="main" id="main"/.test(out['src/App.tsx']) && (out['src/App.tsx'].match(/level=\{1\}/g) || []).length === 1 && /<Field label="Email"/.test(out['src/App.tsx']) },
  { name: 'theme.js is served and built as its own file ahead of the app, and the build trims the CSS', ok: /injectTo: 'head-prepend'/.test(out['vite.config.ts']) && /emitFile/.test(out['vite.config.ts']) && /serupaPurge\(\)/.test(out['vite.config.ts']) },
  { name: 'by default the app installs this release by its tag, named from the folder', ok: made.status === 0 && written.name === 'hello-world' && written.dependencies?.['serupa-ds'] === `github:diki-stwn/serupa-ds#v${pkg.version}`, detail: made.stderr + JSON.stringify(written) },
  { name: 'it refuses a folder with files in it, and a brand it doesn\'t have', ok: again.status === 1 && /isn't empty/.test(again.stderr) && brand.status === 2, detail: again.stderr + brand.stderr },
]));
