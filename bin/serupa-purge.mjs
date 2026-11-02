#!/usr/bin/env node
// Trim Serupa's bundle.css to the classes a product actually uses.
//
// usage:  npx serupa-purge <source files or folders...> [-o out.css] [--css path/to/bundle.css] [--components] [--keep class ... | --keep @file]
//
// Scans the sources (HTML, JSX/TSX, JS/TS, Vue, Svelte, templates…) for anything that looks like a class name
// and writes a copy of bundle.css (by default the one in this package) with only the rules those classes need.
// Kept always: the component styles (dk-*, which components add at runtime), the few utility classes components
// add themselves (sr-only on the screen-reader announcer; dist/components.json lists them), @keyframes, @property,
// @font-face and rules that select no class. Responsive variants are matched by their full name ("md:flex").
//
// --components also drops the styles of components the sources never name. A component counts as used when one
// of its exports appears as a word (<Button, Serupa.Button, import { Button }), and it keeps the components it
// needs (IconButton keeps Button and Icon), from dist/components.json. Use it when the sources name every
// component the product renders.
//
// Class names must appear whole in the source: "md:grid-cols-3" is found, but a name built at runtime
// ("grid-cols-" + n) is not. List those with --keep, or a safelist file with --keep @file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = ['.html', '.htm', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro', '.md', '.mdx', '.php', '.erb', '.hbs', '.njk', '.liquid', '.twig', '.py', '.json'];
const SKIP = ['node_modules', '.git', 'dist', 'build', '.next'];

// A link inside a folder is read when it points at a source file; a linked folder is left out (it may lead back up).
function* files(p) {
  const st = fs.statSync(p);
  if (st.isFile()) { yield p; return; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) { if (!SKIP.includes(e.name)) yield* files(f); }
    else if (EXT.some((x) => e.name.endsWith(x)) && (e.isFile() || (e.isSymbolicLink() && fs.statSync(f, { throwIfNoEntry: false })?.isFile()))) yield f;
  }
}

// Split CSS into top-level items: { kind: 'at' | 'rule' | 'stmt', pre, body }, without a full parser.
function blocks(s) {
  const out = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    if (/\s/.test(s[i])) { i++; continue; }
    let j = i, depth = 0, q = null, brace = -1;
    while (j < n) {
      const ch = s[j];
      if (q) {
        if (ch === '\\') { j += 2; continue; }
        if (ch === q) q = null;
      } else if (ch === '"' || ch === "'") q = ch;
      else if (ch === '{') { if (depth === 0) brace = j; depth++; }
      else if (ch === '}') { depth--; if (depth === 0) { j++; break; } }
      else if (ch === ';' && depth === 0) { j++; break; }
      j++;
    }
    const chunk = s.slice(i, j);
    if (chunk.includes('{')) {
      const pre = s.slice(i, brace).trim();
      out.push({ kind: pre.startsWith('@') ? 'at' : 'rule', pre, body: s.slice(brace + 1, j - 1) });
    } else out.push({ kind: 'stmt', pre: chunk.trim() });
    i = j;
  }
  return out;
}

// "\32 xl\:flex" -> "2xl:flex". An escape for no character (zero, a surrogate, past U+10FFFF) is U+FFFD, as in CSS.
const char = (h) => { const n = parseInt(h, 16); return n === 0 || (n >= 0xd800 && n <= 0xdfff) || n > 0x10ffff ? '\uFFFD' : String.fromCodePoint(n); };
const unescape = (c) => c.replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, h) => char(h)).replace(/\\(.)/g, '$1');
const classesIn = (sel) => [...sel.matchAll(/\.((?:[A-Za-z0-9_-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)/g)].map((m) => unescape(m[1]));

// The dk-* classes to drop: those of the components in the manifest (dist/components.json) that the sources never
// name, nor any component they name needs.
export function unusedComponentClasses(manifest, used) {
  const words = new Set([...used].flatMap((w) => w.split(/[./:]/)));
  const all = manifest.components, keep = new Set();
  // A name more than one component exports (each one's label sets, en and id) says nothing about which is used: a
  // source with id="save" or lang="en" in it kept 45 components (GR99).
  const owners = new Map();
  for (const c of Object.values(all)) for (const e of c.exports) owners.set(e, (owners.get(e) || 0) + 1);
  const add = (n) => { if (keep.has(n) || !all[n]) return; keep.add(n); all[n].uses.forEach(add); };
  for (const [n, c] of Object.entries(all)) if (c.exports.some((e) => owners.get(e) === 1 && words.has(e))) add(n);
  const kept = new Set([...keep].flatMap((n) => all[n].classes));
  return new Set(Object.values(all).flatMap((c) => c.classes).filter((c) => !kept.has(c)));
}

export function purge(css, used, drop = new Set()) {
  const keepSelector = (sel) => classesIn(sel).every((c) => (c.startsWith('dk-') && !drop.has(c)) || used.has(c));
  const walk = (s) => {
    const out = [];
    for (const { kind, pre, body } of blocks(s)) {
      if (kind === 'stmt') { out.push(pre); continue; }
      if (kind === 'at') {
        if (/^@(media|supports|layer|container|starting-style)\b/.test(pre)) {   // rules inside: trimmed like the rest
          const inner = walk(body);
          if (inner.trim()) out.push(`${pre} { ${inner} }`);
        } else out.push(`${pre} {${body}}`);   // @keyframes, @property, @font-face…
        continue;
      }
      const kept = pre.split(/,(?![^()]*\))/).map((x) => x.trim()).filter(keepSelector);
      if (kept.length) out.push(`${kept.join(', ')} {${body}}`);
    }
    return out.join('\n');
  };
  // comments go first (an apostrophe in one would look like a string)
  return walk(css.replace(/\/\*[\s\S]*?\*\//g, ''));
}

export function usedClasses(sources, keep = []) {
  const used = new Set();
  for (const src of sources) {
    for (const f of files(src)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/[A-Za-z0-9_:./%@-]+/g)) used.add(m[0]);
  }
  for (const k of keep) {
    if (k.startsWith('@')) for (const w of fs.readFileSync(k.slice(1), 'utf8').split(/\s+/)) { if (w) used.add(w); }
    else used.add(k);
  }
  return used;
}

const USAGE = 'usage: serupa-purge <source files or folders...> [-o out.css] [--css bundle.css] [--components] [--keep class ...]';
// A mistake on the command line ends with what went wrong and the usage, not a stack trace.
const stop = (message) => { console.error(`serupa-purge: ${message}\n${USAGE}`); process.exit(2); };

function main(argv) {
  const sources = [], keep = [];
  let out = 'bundle.min.css', css = path.join(HERE, '..', 'dist', 'bundle.css'), mode = 'src', components = false;
  const value = (i) => (argv[i] != null && !argv[i].startsWith('-') ? argv[i] : stop(`${argv[i - 1]} needs a file name`));
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0].replace(/^#!.*\n/, '').replace(/^\/\/ ?/gm, '')); return; }
    if (a === '-o' || a === '--out') { out = value(++i); mode = 'src'; }
    else if (a === '--css') { css = value(++i); mode = 'src'; }
    else if (a === '--keep') mode = 'keep';
    else if (a === '--components') components = true;
    else if (a.startsWith('-')) stop(`unknown option ${a}`);
    else if (mode === 'keep') keep.push(a);
    else sources.push(a);
  }
  if (!sources.length) stop('no source files or folders given');
  for (const f of [...sources, css, ...keep.filter((k) => k.startsWith('@')).map((k) => k.slice(1))]) if (!fs.existsSync(f)) stop(`no such file or folder: ${f}`);
  const full = fs.readFileSync(css, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'dist', 'components.json'), 'utf8'));
  const used = usedClasses(sources, [...keep, ...manifest.runtimeUtilities]);
  const drop = components ? unusedComponentClasses(manifest, used) : new Set();
  const result = purge(full, used, drop);
  fs.writeFileSync(out, result + '\n');
  console.log(`${out}: ${(result.length / 1024).toFixed(1)} KB (from ${Math.round(full.replace(/\/\*[\s\S]*?\*\//g, '').length / 1024)} KB)`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
