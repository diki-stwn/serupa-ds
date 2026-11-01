// npm run build: everything a project installs, into dist/ (never edited or committed).
//   index.js, index.d.ts   the components as ES modules, with types (React is a peer dependency): index.js and
//                          icons.js re-export js/, which has one module per source file, so each interactive
//                          component keeps its "use client" and works from React Server Components
//   serupa.iife.js           the browser script: reads window.React, sets window.Serupa
//   components.css         the dk-* component styles, from src/components/<Name>/<Name>.css
//   utilities.css          the utility classes, from src/styles/utilities.template.css (tools/utilities/build.mjs)
//   utilities-extra.css    the masks and gradients, which utilities.css and bundle.css leave out (tools/utilities/extra.mjs)
//   bundle.css             both in one file, components first (what bundle.css has always been)
//   base.css, theme.js     page defaults and automatic dark mode, from src/
//   debug.js               the opt-in debug overlay (?serupa-debug), from src/
//   vscode/                VS Code custom data for editor autocomplete: utility classes and tokens (editor-data.mjs)
//   native/                the tokens for native apps: Swift, Kotlin and Android resources (native-tokens.mjs)
//   components.json        each component's exports, CSS classes and the components it needs (for serupa-purge --components)
//   eslint.js, eslint.d.ts what each component renders, for eslint-plugin-jsx-a11y in a project's lint (serupa-ds/eslint)
//   lib/                   React for plain pages: react.production.min.js sets window.React, and
//                          react-dom.production.min.js sets window.ReactDOM (react-dom and react-dom/client)
//   node tools/build/build.mjs [--css]     --css skips the JavaScript (tsup) step
// First it brings tokens.css (at the package root, committed) up to date with tokens.json: tools/tokens/build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { buildUtilities } from '../utilities/build.mjs';
import { split } from '../utilities/extra.mjs';
import { buildRegistry, cascade } from './registry.mjs';
import { editorData } from './editor-data.mjs';
import { nativeFiles } from './native-tokens.mjs';
import { tokenDescriptions } from '../tokens/build.mjs';
import { a11yComponents } from '../lint/a11y-components.mjs';
import { PAIRS as CONTRAST_PAIRS } from '../tokens/contrast-pairs.mjs';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const D = path.join(P, 'dist');
const { version } = JSON.parse(fs.readFileSync(path.join(P, 'package.json'), 'utf8'));
const read = (f) => fs.readFileSync(path.join(P, f), 'utf8');

// The lists built from the component folders (src/generated/), and the order the styles cascade in.
buildRegistry(P);
const IMPORTS = cascade(P);

// Progress goes to stderr (the child processes' stdout too): npm runs this as "prepare", and npm pack --json
// must print nothing but its JSON.
/** @type {import('node:child_process').StdioOptions} */
const toStderr = ['inherit', 2, 'inherit'];
const tokens = spawnSync(process.execPath, [path.join(P, 'tools', 'tokens', 'build.mjs')], { cwd: P, stdio: toStderr });
if (tokens.status !== 0) process.exit(tokens.status || 1);

fs.mkdirSync(D, { recursive: true });
if (!process.argv.includes('--css')) {
  // tsup reads tsconfig.json and bundles index.d.ts with TypeScript's compiler API: TypeScript 6's (tools/typescript/api.mjs).
  const r = spawnSync(process.execPath, ['--import', path.join(P, 'tools', 'typescript', 'api.mjs'), path.join(P, 'node_modules', 'tsup', 'dist', 'cli-default.js')], { cwd: P, stdio: toStderr });
  if (r.status !== 0) process.exit(r.status || 1);
  await buildModules();
}

const components = IMPORTS.map((n) => read(`src/components/${n}/${n}.css`)).join('');
const utilities = buildUtilities(P);
// Each file declares the system's cascade layers in one order (dk.tokens, dk.base, dk.components, dk.utilities),
// so page styles outside the layers win over them whatever loads first.
const banner = (what) => `/*! Serupa v${version} by Diki · ${what} · CHANGELOG.md */\n@layer dk.tokens, dk.base, dk.components, dk.utilities;\n`;
// Shipped without the source comments (the explained copy is src/), which are about 40% of components.css
// gzipped, and without indentation (7 KB of bundle.css); the /*! banner lines stay. Each rule keeps its own line, so
// devtools still reads well.
const bare = (css) => css.replace(/\/\*(?!!)[\s\S]*?\*\//g, '').replace(/^[ \t]+|[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');
fs.writeFileSync(path.join(D, 'components.css'), banner('components') + bare(components));
// The masks and gradients ship apart, in utilities-extra.css (tools/utilities/extra.mjs): a quarter of the rules, for
// the few pages that use them.
const { core, extra } = split(utilities);
fs.writeFileSync(path.join(D, 'utilities.css'), banner('utilities') + bare(core));
fs.writeFileSync(path.join(D, 'utilities-extra.css'), banner('masks and gradients, after utilities.css or bundle.css') + bare(extra));
fs.writeFileSync(path.join(D, 'bundle.css'), banner('utilities and components') + bare(components) + bare(core));
// base.css and theme.js say __VERSION__ in src/; the build writes package.json's version there, so a release changes
// the number in one place.
const stamp = (s) => s.replaceAll('__VERSION__', version);
fs.writeFileSync(path.join(D, 'base.css'), stamp(bare(read('src/styles/base.css'))));

// components.json: for each component, the names it exports, the dk-* classes its CSS uses and the components it
// needs (the ones it imports, and the ones whose classes it writes out). serupa-purge --components reads it to
// drop the styles of components a project never uses.
const cssOf = Object.fromEntries(IMPORTS.map((n) => [n, read(`src/components/${n}/${n}.css`)]));
const classesOf = Object.fromEntries(IMPORTS.map((n) => [n, [...new Set([...cssOf[n].replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(dk-[A-Za-z0-9_-]+)/g)].map((m) => m[1]))].sort()]));
const tsxOf = (n) => fs.readdirSync(path.join(P, 'src', 'components', n)).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f)).map((f) => read(`src/components/${n}/${f}`)).join('\n');
const manifest = {};
for (const n of IMPORTS) {
  const code = tsxOf(n);
  const exports = [...new Set([...code.matchAll(/^export (?:const|function|class) (\w+)/gm)].map((m) => m[1]))].sort();
  const imported = [...code.matchAll(/from ["']\.\.\/(\w+)\//g)].map((m) => m[1]);
  // A class written out in the code ("dk-btn", or a "dk-btn--" prefix) belongs to the first component in the cascade
  // whose CSS has it: a component's own styles come before the ones that style it in context (index.css).
  const written = [...new Set([...code.matchAll(/dk-[a-z0-9_-]+/g)].map((m) => m[0]))];
  const owners = written.flatMap((w) => IMPORTS.filter((o) => classesOf[o].some((c) => c === w || (w.endsWith('-') && c.startsWith(w)))).slice(0, 1));
  manifest[n] = { exports, uses: [...new Set([...imported, ...owners])].filter((u) => u !== n && IMPORTS.includes(u)).sort(), classes: classesOf[n] };
}
// Utility classes the components put on elements themselves (the announcer's sr-only): serupa-purge keeps them
// whatever the sources use. Any word in a string in src/ that names a utility class counts, which keeps a few extra
// ("hidden" from type="hidden"), never too few.
const code = [];
const scan = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) scan(f); else if (/\.tsx?$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name)) code.push(fs.readFileSync(f, 'utf8')); } };
scan(path.join(P, 'src'));
// Component classes a utility rule names (the focus ring on a Card inside a fill, GR80) are not utilities.
const utilityNames = new Set([...utilities.matchAll(/\.((?:[A-Za-z0-9_-]|\\.)+)/g)].map((m) => m[1].replace(/\\(.)/g, '$1')).filter((n) => !n.startsWith('dk-')));
const runtimeUtilities = [...new Set(code.join('\n').match(/["'`][^"'`\n]*["'`]/g)?.flatMap((q) => q.slice(1, -1).split(/\s+/)) || [])].filter((w) => /^[a-z]/.test(w) && utilityNames.has(w)).sort();
fs.writeFileSync(path.join(D, 'components.json'), JSON.stringify({ version, runtimeUtilities, components: manifest }, null, 1) + '\n');
fs.writeFileSync(path.join(D, 'theme.js'), stamp(read('src/theme.js')));
// debug.js (204): the opt-in overlay that names each component on a page, its classes, state and overridden tokens.
// Its contrast guard (203) checks the pairs tools/test/foundation.mjs checks, written in at build.
fs.writeFileSync(path.join(D, 'debug.js'), stamp(read('src/debug.js')).replace('/*__PAIRS__*/[]', JSON.stringify(CONTRAST_PAIRS)));
// eslint.js (TF2): jsx-a11y skips a component it doesn't know, so a project's <Image src> with no alt or an
// <IconButton> with no name passes its lint. This teaches it what each component renders, from the same map our own
// lint uses (tools/lint/a11y-components.mjs), under both plugins' settings keys: eslint-plugin-jsx-a11y reads
// "jsx-a11y" and its maintained fork eslint-plugin-jsx-a11y-x reads "jsx-a11y-x". labelAttributes is for the rule
// control-has-associated-label: IconButton and TableSelectCell take their name as label.
const a11y = { components: a11yComponents(P), polymorphicPropName: 'as' };
const eslintConfig = { name: 'serupa-ds/jsx-a11y', settings: { 'jsx-a11y': a11y, 'jsx-a11y-x': a11y } };
fs.writeFileSync(path.join(D, 'eslint.js'), `// serupa-ds/eslint ${version}: an ESLint flat-config object that tells eslint-plugin-jsx-a11y what each Serupa
// component renders, so its rules check <Image>, <Link> and <IconButton> as they check img, a and button.
/** The props that name a control, for control-has-associated-label's labelAttributes. */
export const labelAttributes = ["label"];
export default ${JSON.stringify(eslintConfig, null, 1)};
`);
fs.writeFileSync(path.join(D, 'eslint.d.ts'), `/** What each Serupa component renders, under eslint-plugin-jsx-a11y's settings ("jsx-a11y") and its fork's ("jsx-a11y-x"). */
export interface SerupaA11ySettings {
  /** Each component's name and the element it renders: Image is "img", Link is "a". */
  components: Record<string, string>;
  /** The prop that changes the element a component renders. */
  polymorphicPropName: "as";
}
/** The props that name a control, for control-has-associated-label's labelAttributes. */
export declare const labelAttributes: string[];
/** An ESLint flat-config object: put it in your eslint.config.js array, after the jsx-a11y config. */
declare const config: { name: string; settings: { "jsx-a11y": SerupaA11ySettings; "jsx-a11y-x": SerupaA11ySettings } };
export default config;
`);
// stylelint.js: the Stylelint config for an app's own CSS (serupa-ds/stylelint), shipped as written.
fs.writeFileSync(path.join(D, 'stylelint.js'), stamp(read('src/stylelint.js')));
fs.copyFileSync(path.join(P, 'src', 'stylelint.d.ts'), path.join(D, 'stylelint.d.ts'));
// testing.js (184): forEachTheme() for screenshots of an app's own pages in each theme (serupa-ds/testing), as written.
fs.writeFileSync(path.join(D, 'testing.js'), stamp(read('src/testing.js')));
fs.copyFileSync(path.join(P, 'src', 'testing.d.ts'), path.join(D, 'testing.d.ts'));
// purge.js (D11): serupa-purge as a Vite and a PostCSS plugin (serupa-ds/purge), as written; it imports bin/serupa-purge.mjs.
fs.writeFileSync(path.join(D, 'purge.js'), stamp(read('src/purge.js')));
fs.copyFileSync(path.join(P, 'src', 'purge.d.ts'), path.join(D, 'purge.d.ts'));
// VS Code custom data: the utility classes and tokens, for editor autocomplete (tools/build/editor-data.mjs).
const editor = editorData(utilities, read('tokens.css'), tokenDescriptions(JSON.parse(read('tokens.json'))));
fs.mkdirSync(path.join(D, 'vscode'), { recursive: true });
fs.writeFileSync(path.join(D, 'vscode', 'serupa.html-data.json'), JSON.stringify(editor.html) + '\n');
fs.writeFileSync(path.join(D, 'vscode', 'serupa.css-data.json'), JSON.stringify(editor.css) + '\n');
// Tokens for native apps (138): Swift, Kotlin and Android resources (tools/build/native-tokens.mjs).
for (const [f, body] of Object.entries(nativeFiles(path.join(P, 'design-tokens'), version))) {
  fs.mkdirSync(path.dirname(path.join(D, 'native', f)), { recursive: true });
  fs.writeFileSync(path.join(D, 'native', f), body);
}

// React 19 ships no browser builds (React 18's umd/ folder), so they're built here, under the names and globals
// React 18's had. react-dom takes React from window.React, so both use the one copy.
fs.mkdirSync(path.join(D, 'lib'), { recursive: true });
/** @type {import('esbuild').Plugin} */
const windowReact = { name: 'window-react', setup(b) {
  b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'window-react' }));
  b.onLoad({ filter: /.*/, namespace: 'window-react' }, () => ({ contents: 'module.exports = window.React;', loader: 'js' }));
} };
const libs = [
  { file: 'react.production.min.js', contents: "window.React = require('react');", plugins: [] },
  { file: 'react-dom.production.min.js', contents: "window.ReactDOM = Object.assign({}, require('react-dom'), require('react-dom/client'));", plugins: [windowReact] },
];
for (const { file, contents, plugins } of libs) await build({
  stdin: { contents, resolveDir: P, loader: 'js' }, bundle: true, format: 'iife', platform: 'browser', target: 'es2022',
  minify: true, legalComments: 'inline', define: { 'process.env.NODE_ENV': '"production"' }, plugins, outfile: path.join(D, 'lib', file), logLevel: 'warning',
});
console.error(`Built dist/ (v${version})`);

// dist/js/: every source file as its own ES module (src/components/Button/Button.tsx → js/components/Button/Button.js),
// imports kept as imports. Bundled into one file, React Server Components would see one module: either all of it a
// client module, so buttonClass() and paginationRange() couldn't run on the server, or none of it, so no
// interactive component could be used there. Kept apart, each file carries its own "use client" (or none), and a
// project's bundler still drops the components it doesn't import.
async function buildModules() {
  const SRC = path.join(P, 'src');
  const entries = fs.readdirSync(SRC, { recursive: true }).map(String)
    .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$|\.d\.ts$|^browser(-icons)?\.ts$|^theme-types\.ts$/.test(f))
    .map((f) => path.join(SRC, f));
  /** @type {import('esbuild').Plugin} */
  const keepImports = { name: 'keep-imports', setup(b) {
    b.onResolve({ filter: /.*/ }, async (a) => {
      if (a.kind === 'entry-point' || a.pluginData === 'resolving') return undefined;
      if (!a.path.startsWith('.')) return { path: a.path, external: true };   // react, react-dom
      const r = await b.resolve(a.path, { kind: a.kind, resolveDir: a.resolveDir, pluginData: 'resolving' });
      if (r.errors.length) return { errors: r.errors };
      const rel = path.relative(path.dirname(a.importer), r.path).replace(/\.tsx?$/, '.js');
      return { path: rel.startsWith('.') ? rel : './' + rel, external: true };
    });
  } };
  for (const f of fs.readdirSync(D)) if (/^(chunk|icons)-[A-Z0-9]+\.js(\.map)?$|^(index|icons)\.js\.map$/.test(f) || f === 'js') fs.rmSync(path.join(D, f), { recursive: true });
  await build({
    entryPoints: entries, outdir: path.join(D, 'js'), outbase: SRC, bundle: true, plugins: [keepImports],
    format: 'esm', target: 'es2022', platform: 'neutral', sourcemap: true, jsx: 'transform', logLevel: 'warning',
    define: { __VERSION__: JSON.stringify(version) },
  });
  // The generated icon table is data with nothing to step through, and its map was 3 MB of the package: none, for
  // icons.js and each of its parts (material/part/NN.js).
  const part = path.join(D, 'js', 'material', 'part');
  for (const table of [path.join(D, 'js', 'material', 'icons.js'), ...fs.readdirSync(part).filter((f) => f.endsWith('.js')).map((f) => path.join(part, f))]) {
    fs.rmSync(table + '.map');
    fs.writeFileSync(table, fs.readFileSync(table, 'utf8').replace(/\/\/# sourceMappingURL=[\w.]+\.js\.map\n?$/, ''));
  }
  fs.writeFileSync(path.join(D, 'index.js'), 'export * from "./js/index.js";\n');
  fs.writeFileSync(path.join(D, 'icons.js'), 'export * from "./js/material/index.js";\n');
}
