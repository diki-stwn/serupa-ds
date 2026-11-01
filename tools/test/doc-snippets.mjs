// The docs' code compiles (E15): every tsx and jsx block in README.md, docs/ and the component READMEs is
// type-checked against the built types (dist/index.d.ts), imported by the package's name as a project would, so a
// renamed prop or a wrong value type in an example fails here instead of in a reader's editor. A block that leaves
// out its imports gets them (the package's names it uses, React's hooks); a block that is only JSX is checked as a
// component's return value. A block that isn't meant to compile on its own starts with a `// not compiled: why`
// line. Build first (npm run build).
//   node tools/test/doc-snippets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, done, report } from './lib.mjs';

const tsc = path.join(PROJECT, 'node_modules', 'typescript', 'bin', 'tsc');
const DTS = path.join(PROJECT, 'dist', 'index.d.ts');
const built = fs.existsSync(DTS);
// Inside the package, so 'serupa-ds' resolves to it through package.json's exports (a self-reference).
const OUT = path.join(PROJECT, 'node_modules', '.cache', 'doc-snippets');

const dts = built ? fs.readFileSync(DTS, 'utf8') : '';
const exported = new Set();
for (const m of dts.matchAll(/^export (?:type )?\{([^}]*)\}/gm)) for (const n of m[1].split(',')) { const x = n.trim().split(/\s+as\s+/).pop(); if (x) exported.add(x); }
for (const m of dts.matchAll(/^export (?:declare )?(?:const|function|interface|type|class) (\w+)/gm)) exported.add(m[1]);
// DOM globals a sketch may use as its own state or handlers (open, setOpen): declared as any where it doesn't declare them.
const GLOBALS = ['open', 'close', 'name', 'error', 'status', 'event', 'focus', 'blur', 'confirm', 'print', 'stop', 'find', 'scroll', 'origin', 'length', 'parent', 'top', 'self', 'closed', 'toolbar', 'menubar', 'history', 'location'];
const HOOKS = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useId', 'useTransition', 'useDeferredValue'];

// Blocks that don't compile yet, and why. It only shrinks: a block listed here that compiles fails until it's taken out.
const KNOWN = {
  // SidebarItem's `as` is React.ElementType, so the router link's own props (to) are a type error in
  // a TypeScript project. Link, BreadcrumbItem and NavbarLink type it with the element's props (#779, G10); it's next.
  'src/components/Sidebar/README.md:5': 'as={RouterLink} to',
};

const COMP = path.join(PROJECT, 'src', 'components');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [path.join(dir, e.name)] : []));
const docs = [path.join(PROJECT, 'README.md'), ...walk(path.join(PROJECT, 'docs')).filter((f) => !f.includes('template')),
  ...fs.readdirSync(COMP).map((d) => path.join(COMP, d, 'README.md')).filter((f) => fs.existsSync(f))];

// A block, as a module. The component READMEs open with a sketch: the names taken from window.Serupa, then a few
// JSX examples one after another, with // notes between them and … where content goes. The names become imports, the
// examples JSX expressions (notes as JSX comments, … as any content), and what they leave undeclared (open,
// setOpen) is declared as any by a second pass, so the props and the values written out are what's checked.
const IMPORT = /^\s*import[^;]*?from\s*["'][^"']+["'];?[ \t]*$/gms;
function moduleOf(code, loose = []) {
  code = code.replace(/^\s*const\s*\{[^}]*\}\s*=\s*window\.Serupa;?\s*$/gm, '');
  const body = code.replace(IMPORT, '');
  const has = (name) => new RegExp(`import[^;]*\\b${name}\\b[^;]*from`).test(code);
  const used = (name) => new RegExp(`(?<![\\w.$'"-])${name}\\b`).test(body);
  const ours = [...exported].filter((n) => used(n) && !has(n));
  const hooks = HOOKS.filter((n) => used(n) && !has(n));
  const head = [!/import\s+(\*\s+as\s+)?React\b/.test(code) && 'import * as React from "react";',
    hooks.length && `import { ${hooks.join(', ')} } from "react";`, ours.length && `import { ${ours.join(', ')} } from "serupa-ds";`,
    ...loose.map((n) => `declare const ${n}: any;`)].filter(Boolean);
  // A sketch: JSX examples (from a line that starts with <, to a blank line or the next statement or note at the margin) between
  // statements (const [open, setOpen] = useState(false); toast("Saved")). Each example is checked as an expression.
  if (/^</m.test(body) && !/^(export|function)\b/m.test(body)) {
    const out = [];
    let jsx = null;
    const end = () => { if (jsx) out.push(`void (<>\n${jsx.join('\n').replace(/^(\s*)\/\/(.*)$/gm, '$1{/*$2*/}').replace(/=\{…\}/g, '={undefined as any}').replace(/…/g, '{undefined as any}')}\n</>);`); jsx = null; };
    for (const line of body.split('\n')) {
      if (jsx && (!line.trim() || /^(\/\/|[\w$])/.test(line))) end();
      if (!jsx && line.startsWith('<')) jsx = [];
      if (jsx) jsx.push(line); else out.push(line.replace(/…/g, ''));
    }
    end();
    return [...(code.match(IMPORT) || []), ...head, `export async function Snippet() {\n${out.join('\n')}\n}`].join('\n');
  }
  return [...head, code.replace(/…/g, ''), 'export {};'].join('\n');
}

const blocks = [];
for (const f of docs) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/^```(tsx|jsx)[^\n]*\n(.*?)^```/gms)) {
    if (/^\s*\/\/ not compiled:/.test(m[2])) continue;
    blocks.push({ where: `${path.relative(PROJECT, f)}:${text.slice(0, m.index).split('\n').length}`, code: m[2] });
  }
}

const R = [];
if (!built) R.push({ name: 'the docs\' tsx and jsx blocks type-check', ok: false, detail: 'dist/index.d.ts is missing: npm run build first' });
else {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const files = blocks.map((b, i) => `block${i}.tsx`);
  // Other packages an example imports (next/headers, a router) are any: what's checked is this package's API.
  const others = new Set(blocks.flatMap((b) => [...b.code.matchAll(/from\s*["']([^"'.][^"']*)["']/g)].map((m) => m[1])).filter((m) => !/^(react|react-dom|serupa-ds)(\/|$)/.test(m)));
  fs.writeFileSync(path.join(OUT, 'others.d.ts'), [...others].map((m) => `declare module ${JSON.stringify(m)};`).join('\n') + '\n');
  files.push('others.d.ts');
  fs.writeFileSync(path.join(OUT, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', lib: ['DOM', 'DOM.Iterable', 'ES2022'], jsx: 'react-jsx', strict: true, noImplicitAny: false, noEmit: true, skipLibCheck: true, types: [] },
    files,
  }));
  const compile = (loose) => {
    blocks.forEach((b, i) => fs.writeFileSync(path.join(OUT, files[i]), moduleOf(b.code, loose[i])));
    const run = spawnSync(process.execPath, [tsc, '-p', OUT], { cwd: PROJECT, encoding: 'utf8' });
    return [...(run.stdout + run.stderr).matchAll(/block(\d+)\.tsx\(\d+,\d+\): error (TS\d+): (.*)/g)].map((m) => ({ i: +m[1], code: m[2], text: m[3] }));
  };
  // Second pass: what a sketch leaves undeclared becomes any.
  const loose = blocks.map(() => []);
  blocks.forEach((b, i) => { for (const n of GLOBALS) if (new RegExp(`(?<![\\w.$'"-])${n}\\b(?!\\s*:)`).test(b.code) && !new RegExp(`\\b(const|let|var|function)\\b[^=;]*\\b${n}\\b`).test(b.code)) loose[i].push(n); });
  for (const e of compile(loose)) { const n = /^TS2304|^TS2552/.test(e.code) && /Cannot find name '(\w+)'/.exec(e.text); if (n && !loose[e.i].includes(n[1])) loose[e.i].push(n[1]); }
  const errors = new Map();
  for (const e of compile(loose)) if (!errors.has(e.i)) errors.set(e.i, `${e.code}: ${e.text}`);
  blocks.forEach((b, i) => R.push(KNOWN[b.where]
    ? { name: `${b.where} is in KNOWN (${KNOWN[b.where]}) and still doesn't compile`, ok: errors.has(i), detail: 'it compiles now: take it out of KNOWN' }
    : { name: `${b.where} compiles`, ok: !errors.has(i), detail: errors.get(i) }));
  for (const where of Object.keys(KNOWN)) if (!blocks.some((b) => b.where === where)) R.push({ name: `KNOWN's ${where} is a block in the docs`, ok: false, detail: 'it moved or went: update KNOWN' });
}
done(report('Doc snippets', R));
