// Development warnings stay out of production (G1): every warnOnce() call in src/ sits behind
// process.env.NODE_ENV !== "production", which every bundler sets for a production build, so the messages and the
// console.warn behind them drop out of an app's bundle. Bundles dist/index.js as an app would (esbuild, minified,
// React external) twice: for production, where no warning may be left, and for development, where every one must be.
// serupa.iife.js keeps them: a plain page has no build step to turn them back on (tsup.config.mjs).
//   node tools/test/dev-warnings.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { PROJECT, done, report } from './lib.mjs';

const files = fs.readdirSync(path.join(PROJECT, 'src'), { recursive: true }).map(String)
  .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) && !f.endsWith('.d.ts'));
// Each warning's code (warnOnce's first argument), which only the warning uses.
const keys = [...new Set(files.flatMap((f) => [...fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8').matchAll(/warnOnce\(\s*"([a-z]+(?:-[a-z]+)+)"\s*,/g)].map((m) => m[1])))].sort();
const bundle = (mode) => esbuild.buildSync({
  stdin: { contents: "export * from './dist/index.js';", resolveDir: PROJECT }, bundle: true, minify: true, write: false,
  format: 'esm', platform: 'browser', external: ['react', 'react-dom'], define: { 'process.env.NODE_ENV': JSON.stringify(mode) }, logLevel: 'silent',
}).outputFiles[0].text;
const iife = fs.readFileSync(path.join(PROJECT, 'dist', 'serupa.iife.js'), 'utf8');
const prod = bundle('production'), dev = bundle('development');
const left = keys.filter((k) => prod.includes(`"${k}"`));
const lost = keys.filter((k) => !dev.includes(`"${k}"`));
// Every code has its section in docs/warnings.md, which the warning links to, and every section is a code in use.
const sections = [...fs.readFileSync(path.join(PROJECT, 'docs', 'warnings.md'), 'utf8').matchAll(/^## (\S+)$/gm)].map((m) => m[1]);
const calls = files.filter((f) => !f.endsWith('warn.ts')).flatMap((f) => [...fs.readFileSync(path.join(PROJECT, 'src', f), 'utf8').matchAll(/warnOnce\(\s*([^,]+),/g)].map((m) => m[1].trim()));
done(report('Development warnings', [
  { name: 'every warning has a code: a plain string as its first argument', ok: calls.every((c) => /^"[a-z]+(?:-[a-z]+)+"$/.test(c)), detail: `not a code: ${calls.filter((c) => !/^"[a-z]+(?:-[a-z]+)+"$/.test(c)).join(', ')}. Pass the code first, and a key third when the warning is given once per something` },
  { name: 'every code has its section in docs/warnings.md, and every section is a code in use', ok: keys.every((k) => sections.includes(k)) && sections.every((s) => keys.includes(s)), detail: `no section: ${keys.filter((k) => !sections.includes(k)).join(', ') || 'none'}; no warning: ${sections.filter((s) => !keys.includes(s)).join(', ') || 'none'}` },
  { name: 'docs/warnings.md lists the codes in order', ok: sections.join() === [...sections].sort().join(), detail: sections.join(', ') },
  { name: `the warnings were found (${keys.length} codes)`, ok: keys.length >= 20, detail: keys.join(', ') },
  { name: 'a development build keeps every warning', ok: !lost.length && dev.includes('console.warn'), detail: `missing: ${lost.join(', ') || 'console.warn'}` },
  { name: 'a production build has no warning left (no console.warn, no warning text)', ok: !left.length && !prod.includes('console.warn'),
    detail: `${left.length ? `left in: ${left.join(', ')}` : 'console.warn is still there'}. Put the warnOnce() call behind process.env.NODE_ENV !== "production"` },
  { name: 'serupa.iife.js keeps the warnings, and nothing in it reads process (a plain page has none)', ok: iife.includes('console.warn') && !/\bprocess\.env\b/.test(iife), detail: 'set process.env.NODE_ENV to "development" in tsup.config.mjs\'s define' },
  { name: 'a production build is smaller than a development one', ok: prod.length < dev.length, detail: `${prod.length} B, against ${dev.length} B` },
]));
