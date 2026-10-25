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

// SERUPA_BUILD=iife builds the browser script only (the icon test builds a scratch copy that way).
const only = process.env.SERUPA_BUILD;

export default defineConfig([
  ...(only === 'iife' ? [] : [{
    entry: { index: 'src/index.ts', icons: 'src/material/index.ts' },
    format: ['esm'],
    dts: { only: true },
    clean: false,
    external: ['react', 'react-dom'],
  }]),
  ...[['serupa.iife', 'src/browser.ts'], ['serupa-icons.iife', 'src/browser-icons.ts']].map(([name, file]) => ({
    entry: { [name]: file },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    target: 'es2022',
    platform: 'browser',
    clean: false,
    define,
    esbuildPlugins: [windowReact],
    minify: true,
    // A map beside the browser script, so a stack trace on a page can be read; the map points to the sources by
    // path without carrying them, which would double the package.
    ...(name === 'serupa.iife' ? { sourcemap: true, esbuildOptions(o) { o.sourcesContent = false; } } : {}),
    banner: {
      js: name === 'serupa.iife' ? `/*! Serupa v${version} by Diki · components (needs React 19) · CHANGELOG.md */` : `/*! Serupa v${version} · serupa-icons.iife.js is empty since 6.1 (serupa.iife.js has every icon): remove it from your page */`,
    },
  })),
]);
