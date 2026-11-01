// Builds dist/index.d.ts and dist/icons.d.ts, and serupa.iife.js (the browser script that reads window.React and
// sets window.Serupa). The ES modules (dist/js/, one file per source file) and the CSS come from
// tools/build/build.mjs, which runs this first: npm run build.
import fs from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// The browser script keeps the development warnings (warnOnce): a plain page has no build step that could turn them
// back on, and no process to read. React comes from the page, so this doesn't change which React runs.
const define = { __VERSION__: JSON.stringify(version), 'process.env.NODE_ENV': '"development"' };

// In the browser script, react and react-dom come from the page: window.React and window.ReactDOM.
const windowReact = {
  name: 'window-react',
  setup(build) {
    build.onResolve({ filter: /^react(-dom)?$/ }, (a) => ({ path: a.path, namespace: 'window-react' }));
    build.onLoad({ filter: /.*/, namespace: 'window-react' }, (a) => ({ contents: a.path === 'react-dom' ? 'module.exports = window.ReactDOM;' : 'module.exports = window.React;', loader: 'js' }));
  },
};

// serupa.iife.js leaves out the full icon table (src/material/icons.ts and its parts): src/browser.ts loads
// serupa-icons.iife.js, which has it, when an Icon first needs it. Here src/icons.ts's imports of the table and of
// parts.ts are empty modules: an IIFE can't split, so the parts would all land in the script.
const noTable = {
  name: 'no-icon-table',
  setup(build) {
    build.onResolve({ filter: /^\.\/material\/(icons|parts)$/ }, (a) => (/[\\/]src[\\/]icons\.ts$/.test(a.importer) ? { path: a.path, namespace: 'no-icon-table' } : undefined));
    build.onLoad({ filter: /.*/, namespace: 'no-icon-table' }, () => ({ contents: 'export {};', loader: 'js' }));
  },
};

// SERUPA_BUILD=iife builds the browser script only (the icon test builds a scratch copy that way).
const only = process.env.SERUPA_BUILD;

export default defineConfig([
  // One build per entry, so each .d.ts holds its own types: built together, the types both use (IconData,
  // MaterialIconName) would go to a third, hashed file. Written out (not mapped) so knip reads both entries.
  // stripInternal: a prop tagged @internal (Calendar's hooks for DateRangePicker) stays out of the public types.
  ...(only === 'iife' ? [] : [
    { entry: { index: 'src/index.ts' }, format: ['esm'], dts: { only: true, compilerOptions: { stripInternal: true } }, clean: false, external: ['react', 'react-dom'] },
    { entry: { icons: 'src/material/index.ts' }, format: ['esm'], dts: { only: true, compilerOptions: { stripInternal: true } }, clean: false, external: ['react', 'react-dom'] },
  ]),
  ...[['serupa.iife', 'src/browser.ts'], ['serupa-icons.iife', 'src/browser-icons.ts']].map(([name, file]) => ({
    entry: { [name]: file },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    target: 'es2022',
    platform: 'browser',
    clean: false,
    define,
    esbuildPlugins: name === 'serupa.iife' ? [windowReact, noTable] : [windowReact],
    minify: true,
    // A map beside the browser script, so a stack trace on a page can be read; the map points to the sources by
    // path without carrying them, which would double the package.
    ...(name === 'serupa.iife' ? { sourcemap: true, esbuildOptions(o) { o.sourcesContent = false; } } : {}),
    banner: {
      js: name === 'serupa.iife' ? `/*! Serupa v${version} by Diki · components (needs React 19) · CHANGELOG.md */` : `/*! Serupa v${version} · every Material Symbol by name (Apache 2.0): serupa.iife.js loads this itself when an Icon needs it */`,
    },
  })),
]);
