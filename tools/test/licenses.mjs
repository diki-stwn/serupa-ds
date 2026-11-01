// Licenses: the package says it's Diki's (license UNLICENSED, the LICENSE file), and every outside work it ships
// comes with its license. Those works are the README's Credits table: each row's license file is in licenses/, each
// file in licenses/ and fonts/ is in a row, and the packages the build bundles into dist/lib/ (React, react-dom and
// what they bring along) are each covered by a row, with the license their package.json declares.
//   node tools/test/licenses.mjs
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { PROJECT, read, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const pkg = JSON.parse(read('package.json'));

t('package.json says the package is not open source (license: UNLICENSED)', pkg.license === 'UNLICENSED', pkg.license);
const own = fs.existsSync(path.join(PROJECT, 'LICENSE')) ? read('LICENSE') : '';
t('LICENSE says who holds the rights and points to the outside works\' licenses', /All rights reserved/.test(own) && own.includes('licenses/'), own.slice(0, 80));
t('the package ships licenses/ (npm adds LICENSE itself)', pkg.files.includes('licenses/'), pkg.files.join(', '));

// The Credits table: | Work | Used for | License — `licenses/<file>` |
const credits = read('README.md').split(/^## Credits$/m)[1]?.split(/^## /m)[0] ?? '';
const rows = credits.split('\n').filter((l) => /^\| [^-]/.test(l) && !l.startsWith('| Work |'));
const named = rows.flatMap((r) => [...r.matchAll(/`licenses\/([^`]+)`/g)].map((m) => m[1]));
const files = fs.readdirSync(path.join(PROJECT, 'licenses'));
t('every license the Credits table names is in licenses/', named.length && named.every((f) => files.includes(f)), named.filter((f) => !files.includes(f)).join(', '));
t('every file in licenses/ is a row in the Credits table', files.every((f) => named.includes(f)), files.filter((f) => !named.includes(f)).join(', '));
const fonts = fs.readdirSync(path.join(PROJECT, 'fonts'));
// A name may have one * (`fonts/InterVariable-*.woff2`, the font split by script) for the files it stands for.
const globs = [...credits.matchAll(/`fonts\/([^`*]*)\*([^`*]*)`/g)].map(([, a, b]) => (f) => f.startsWith(a) && f.endsWith(b) && f.length > a.length + b.length);
const credited = (f) => credits.includes(`fonts/${f}`) || globs.some((g) => g(f));
t('every font the package ships is in the Credits table', fonts.every(credited), fonts.filter((f) => !credited(f)).join(', '));

// What the build bundles into dist/lib/: the same two entries as tools/build/build.mjs, read for their inputs.
const bundled = new Set();
for (const contents of ["window.React = require('react');", "window.ReactDOM = Object.assign({}, require('react-dom'), require('react-dom/client'));"]) {
  const { metafile } = await build({ stdin: { contents, resolveDir: PROJECT, loader: 'js' }, bundle: true, write: false, metafile: true, platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' });
  for (const input of Object.keys(metafile.inputs)) { const m = input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//); if (m) bundled.add(m[1]); }
}
// Each bundled package, the Credits row that covers it and the license that row is under.
const COVERED = { react: ['React', 'MIT'], 'react-dom': ['React', 'MIT'], scheduler: ['React', 'MIT'] };
const unknown = [...bundled].filter((p) => !COVERED[p]);
t('every package bundled into dist/lib/ is covered by a Credits row', bundled.size && !unknown.length, `${unknown.join(', ')}: add a row and its license, then a COVERED line here`);
const mismatched = [...bundled].filter((p) => COVERED[p]).filter((p) => {
  const declared = JSON.parse(read(`node_modules/${p}/package.json`)).license;
  const [work, license] = COVERED[p];
  return declared !== license || !rows.some((r) => r.startsWith(`| ${work} `) && r.includes(license));
}).map((p) => `${p} (${JSON.parse(read(`node_modules/${p}/package.json`)).license})`);
t('each bundled package\'s own license is the one its Credits row names', !mismatched.length, mismatched.join(', '));
const react = JSON.parse(read('node_modules/react/package.json')).version;
t('the Credits table names the React version dist/lib/ is built from', rows.some((r) => r.startsWith(`| React ${react} `)), `installed ${react}`);

done(report('Licenses', R));
