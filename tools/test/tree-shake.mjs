// Tree-shaking (117, J5): a project that imports one export ships only the modules that export needs, with each of
// the bundlers projects use. For every export of the package, each bundler builds `export { X } from "serupa-ds"`
// from dist/js (one module per source file) and lists the package modules that put code in the output. Each must be
// one that X's own module reaches by its imports: a module only another export needs, or the package's index, means
// that bundler kept code nobody asked for (a module the package's "sideEffects" lists, or one with an effect that a
// barrel it passes through brings along). `import "serupa-ds"` alone must put nothing in the output.
// Build first (npm run build).
//   node tools/test/tree-shake.mjs
// Bundlers: esbuild, Rollup (reading "sideEffects" the way @rollup/plugin-node-resolve does, and again without it),
// Rolldown (what Vite 8 builds with) and webpack (production mode). The full icon set, a dynamic import(), stays a chunk of its own here;
// size.mjs measures a build that doesn't split it off (DM1). esbuild must also print no warnings while bundling (FD1).
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { rollup } from 'rollup';
import { rolldown } from 'rolldown';
import webpack from 'webpack';
import { PROJECT, done, report } from './lib.mjs';

const JS = path.join(PROJECT, 'dist', 'js');
const ENTRY = path.join(JS, 'index.js');
const isReact = (id) => /^react(-dom)?(\/|$)/.test(id);
// The dynamic import() of the full icon set, left out of the build as a chunk loaded on demand.
const lazy = { name: 'lazy', setup(b) { b.onResolve({ filter: /.*/ }, (a) => a.kind === 'dynamic-import' ? { path: a.path, external: true } : undefined); } };
const lazyChunk = { name: 'lazy', resolveDynamicImport: (id) => typeof id === 'string' ? { id, external: true } : null };

// The modules' static imports, and where each export is declared.
const text = new Map();
const read = (f) => text.get(f) ?? text.set(f, fs.readFileSync(f, 'utf8')).get(f);
const rel = (f, p) => path.resolve(path.dirname(f), p);
const deps = (f) => [...read(f).matchAll(/^(?:import|export)\b[^;]*?\bfrom\s*"(\.[^"]+)"|^import\s*"(\.[^"]+)"/gm)].map((m) => rel(f, m[1] ?? m[2]));
const specs = (list) => list.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [a, b = a] = s.split(/\s+as\s+/); return [a, b]; });
// chain: the modules the export passes through on its way to the package's index, which re-export it.
function declaredIn(f, name, chain = []) {
  chain.push(f);
  const src = read(f);
  const local = [...src.matchAll(/^export\s*\{([^}]*)\}\s*;/gm)].flatMap((m) => specs(m[1])).find(([, b]) => b === name)?.[0] ?? name;
  if (new RegExp(`^(?:export\\s+)?(?:async\\s+)?(?:function\\*?|var|let|const|class)\\s+${local}\\b`, 'm').test(src)) return f;
  for (const m of src.matchAll(/^(import|export)\s*\{([^}]*)\}\s*from\s*"(\.[^"]+)"/gm)) {
    const hit = specs(m[2]).find(([, b]) => b === (m[1] === 'import' ? local : name));
    if (hit) return declaredIn(rel(f, m[3]), hit[0], chain);
  }
  for (const m of src.matchAll(/^export\s*\*\s*from\s*"(\.[^"]+)"/gm)) {
    const tried = [...chain], hit = declaredIn(rel(f, m[1]), name, tried);
    if (hit) { chain.splice(0, chain.length, ...tried); return hit; }
  }
  return null;
}
function reach(f, seen = new Set()) {
  if (!seen.has(f)) { seen.add(f); for (const d of deps(f)) reach(d, seen); }
  return seen;
}

const exported = Object.keys(await import(ENTRY)).sort();
const via = {};
const where = Object.fromEntries(exported.map((x) => [x, declaredIn(ENTRY, x, via[x] = [])]));

// The package's "sideEffects", as a bundler reads it.
const effects = JSON.parse(fs.readFileSync(path.join(PROJECT, 'package.json'), 'utf8')).sideEffects;
const hasEffects = (id) => effects.some((p) => p.startsWith('*.') ? id.endsWith(p.slice(1)) : path.resolve(PROJECT, p) === id);

const code = (list) => list.length ? `export { ${list.join(', ')} } from ${JSON.stringify(ENTRY)};` : `import ${JSON.stringify(ENTRY)};`;
// [module, bytes it put in the output] for the package's modules.
const ours = (list) => list.map(([id, n]) => [path.resolve(PROJECT, id), n]).filter(([id, n]) => n > 0 && id.startsWith(JS + path.sep));
const ENTRY_ID = path.join(PROJECT, '__entry.js');
const virtual = (src) => ({ name: 'entry', resolveId: (id) => id === ENTRY_ID ? id : null, load: (id) => id === ENTRY_ID ? src : null });
// esbuild and webpack build every group at once, one entry each, from files in .test-tmp/tree-shake/.
const DIR = path.join(PROJECT, '.test-tmp', 'tree-shake');
const entries = (groups) => {
  fs.mkdirSync(DIR, { recursive: true });
  return groups.map((list, i) => { const f = path.join(DIR, `e${i}.js`); fs.writeFileSync(f, code(list)); return f; });
};

async function rollupEach(groups, moduleSideEffects) {
  const out = [];
  for (const list of groups) {
    const b = await rollup({ input: ENTRY_ID, plugins: [virtual(code(list)), lazyChunk], external: isReact, treeshake: { moduleSideEffects }, onwarn() {} });
    const { output } = await b.generate({ format: 'es' });
    out.push(ours(Object.entries(output[0].modules).map(([k, m]) => [k, m.renderedLength])));
  }
  return out;
}

// What a bundler warned about while building, which a project bundling the package would see too: esbuild's
// "Ignoring this import because … marked as having no side effects" is a bare import left by import { type X } (FD1).
const warned = {};
// Each takes the groups of exports to import, and returns for each one what its build kept.
const BUNDLERS = {
  async esbuild(groups) {
    const files = entries(groups);
    const r = await esbuild.build({ entryPoints: files, outdir: path.join(DIR, 'out'), bundle: true, minify: true, write: false, metafile: true, format: 'esm', platform: 'browser', external: ['react', 'react-dom'], plugins: [lazy], logLevel: 'silent' });
    const by = Object.fromEntries(Object.values(r.metafile.outputs).filter((o) => o.entryPoint).map((o) => [path.resolve(PROJECT, o.entryPoint), o.inputs]));
    // Not the warning on `import "serupa-ds"` alone, which the test asks for on purpose.
    warned.esbuild = r.warnings.filter((w) => !w.location || !path.resolve(PROJECT, w.location.file).startsWith(DIR));
    return files.map((f) => ours(Object.entries(by[f]).map(([k, v]) => [k, v.bytesInOutput])));
  },
  rollup: (groups) => rollupEach(groups, (id) => !id.startsWith(JS) || hasEffects(id)),
  // A bundler that doesn't read "sideEffects" (Rollup without the resolve plugin, a CDN that bundles each package)
  // judges each module by its code: every top-level call needs /*#__PURE__*/, or it keeps the module.
  'rollup without "sideEffects"': (groups) => rollupEach(groups, true),
  async rolldown(groups) {
    const out = [];
    for (const list of groups) {
      const b = await rolldown({ input: ENTRY_ID, plugins: [virtual(code(list)), lazyChunk], external: isReact, cwd: PROJECT, logLevel: 'silent' });
      const { output } = await b.generate({ format: 'es' });
      out.push(ours(Object.entries(output[0].modules).map(([k, m]) => [k, m.renderedLength])));
    }
    return out;
  },
  // Each entry is a runtime of its own, and production mode works out the exports used for each runtime apart.
  async webpack(groups) {
    const files = entries(groups);
    const compilation = await new Promise((resolve, reject) => webpack({
      mode: 'production', context: PROJECT, entry: Object.fromEntries(files.map((f, i) => [`e${i}`, f])), output: { path: path.join(DIR, 'out'), library: { type: 'module' } }, experiments: { outputModule: true },
      externalsType: 'module', externals: { react: 'react', 'react-dom': 'react-dom' }, optimization: { minimize: false }, devtool: false,
    }, (err, stats) => err || stats.hasErrors() ? reject(err || new Error(stats.toString('errors-only'))) : resolve(stats.compilation)));
    // The entry's own chunks (the icon set is a chunk of its own, loaded on demand). Webpack joins the modules it
    // keeps into one (module concatenation) and doesn't say how much each wrote.
    return files.map((f, i) => ours(compilation.entrypoints.get(`e${i}`).chunks
      .flatMap((c) => [...compilation.chunkGraph.getChunkModulesIterable(c)]).flatMap((m) => m.modules ? [...m.modules] : [m])
      .filter((m) => m.resource && m.resource !== f).map((m) => [m.resource, Infinity])));
  },
};
// esbuild counts the output's `export { a as formatNumber }` as coming from a module the export passed through.
const CLAUSE = 64;

const short = (f) => path.relative(JS, f);
const groups = [[], ...exported.map((x) => [x])];
const lost = exported.filter((x) => !where[x]);
const results = [{ name: `found where each of the ${exported.length} exports is declared`, ok: exported.length > 100 && !lost.length, detail: lost.length ? `not found: ${lost.join(', ')}` : `only ${exported.length} exports` }];
for (const [name, run] of Object.entries(BUNDLERS)) {
  const [none, ...each] = await run(groups);
  results.push({ name: `${name}: import "serupa-ds" alone ships nothing`, ok: !none.length, detail: `ships ${none.map(([f]) => short(f)).join(', ')}` });
  const extra = [];
  exported.forEach((x, i) => {
    const ok = reach(where[x]);
    const kept = each[i].filter(([f, n]) => !ok.has(f) && !(via[x].includes(f) && n <= CLAUSE));
    if (kept.length) extra.push(`${x} (${short(where[x])}) also ships ${kept.map(([f, n]) => n === Infinity ? short(f) : `${short(f)} (${n} B)`).join(', ')}`);
  });
  results.push({ name: `${name}: each of the ${exported.length} exports ships only the modules it imports`, ok: !extra.length, detail: extra.join('\n      ') });
  if (warned[name]) {
    const seen = [...new Set(warned[name].map((w) => `${w.location ? path.relative(PROJECT, path.resolve(PROJECT, w.location.file)) + ':' + w.location.line + ': ' : ''}${w.text}`))];
    results.push({ name: `${name}: bundling the package prints no warnings`, ok: !seen.length, detail: seen.join('\n      ') });
  }
}
fs.rmSync(DIR, { recursive: true, force: true });
done(report('tree-shake', results));
