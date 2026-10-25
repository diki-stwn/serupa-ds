// Two projects:
// - components (npm run test:unit, or npm run test:watch): the tests next to each component
//   (src/components/<Name>/<Name>.test.tsx), run in a real Chromium through Playwright so computed styles,
//   focus and keyboard behave as they do for people.
// - checks (npm run test:checks): the scripts in tools/test/ that check the package, tokens, icons, guides and
//   API in Node, each result a test. Build first (npm run build). Each still runs alone with node, too.
import fs from 'node:fs';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { buildUtilities } from './tools/utilities/build.mjs';
import { buildRegistry } from './tools/build/registry.mjs';
import { forcedColors, pointerDown, pointerDrag, pointerUp, printMedia } from './tools/test/vitest/commands.ts';

const { version } = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// src/styles/index.css imports the generated utilities.css; make it from the template and tokens first.
buildUtilities(new URL('.', import.meta.url).pathname);
// …and the export, style and label lists from the component folders (src/generated/).
buildRegistry(new URL('.', import.meta.url).pathname);

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  // The modern JSX runtime, as apps build with. tsconfig's "jsx": "react" (classic, for the package build) would
  // make React 19 warn "outdated JSX transform" in dev, which the tests that fail on a console warning catch.
  oxc: { jsx: { runtime: 'automatic' } },
  // Bundled up front: found mid-run, Vite re-optimizes and reloads, failing the test files already loading.
  optimizeDeps: { include: ['react/jsx-dev-runtime', 'react/jsx-runtime', 'axe-core'] },
  plugins: [{
    // /__slow-picture__.svg answers after a second, so a test can see a picture while it loads in every engine
    // (lazy loading below the fold can't do that: each engine starts lazy pictures at its own distance).
    name: 'slow-picture',
    configureServer(server) {
      server.middlewares.use('/__slow-picture__.svg', (_req, res) => setTimeout(() => {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-store');
        res.end('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#3b82f6"/></svg>');
      }, 1000));
    },
  }],
  test: {
    projects: [{
      extends: true,
      test: {
        name: 'components',
        include: ['src/**/*.test.tsx'],
        // Files and the tests in each run in a random order (Vitest prints the seed; --sequence.seed=<n> repeats
        // one), so no test can lean on what the one before it left behind.
        sequence: { shuffle: true },
        setupFiles: ['./tools/test/vitest/setup.ts'],
        // In Firefox the test files run side by side in frames of one page, and so share its one mouse: a hover in
        // one file landed in the middle of a drag in another. One file at a time there.
        fileParallelism: process.env.SERUPA_BROWSER !== 'firefox',
        browser: {
          enabled: true,
          headless: true,
          // Headless Firefox finds no pointing device and reports (hover: none), so hover styles (all behind
          // @media (hover: hover)) would never apply. Give it a desktop's fine, hovering pointer, as lib.mjs does.
          provider: playwright({
            ...(process.env.SERUPA_BROWSER === 'firefox' ? { launchOptions: { firefoxUserPrefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } } } : {}),
            // SERUPA_LOCALE=ar runs them with the browser in that language (navigator.language and Intl's default
            // locale), so nothing reads the default and quietly expects English (run.mjs --locale).
            ...(process.env.SERUPA_LOCALE ? { contextOptions: { locale: process.env.SERUPA_LOCALE } } : {}),
          }),
          // SERUPA_BROWSER=firefox|webkit runs them in that engine, like the rest of the suite (run.mjs --browser).
          instances: [{ browser: (process.env.SERUPA_BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium' }],
          viewport: { width: 900, height: 700 },
          commands: { pointerDrag, pointerDown, pointerUp, forcedColors, printMedia },
        },
      },
    }, {
      test: {
        name: 'checks',
        include: ['tools/test/*.mjs'],
        // Shared code, the cross-browser comparison (npm run test:safari) and the visual and Storybook steps, which
        // run.mjs shards across CI jobs.
        exclude: ['tools/test/{lib,run,webdriver,compat,visual,storybook}.mjs'],
        environment: 'node',
        // Several write their pages to the one .test-tmp/ folder and remove it when done: one file at a time.
        fileParallelism: false,
      },
    }],
    // npm run test:coverage: which lines of src/ the component tests run (V8, in Chromium), written to coverage/
    // (index.html to browse, coverage-summary.json for CI). Only the components with a <Name>.test.tsx count yet.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.stories.tsx', 'src/material/**', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      // Floors a little under the full run's figures on 25 Oct 2026 (96.2 / 88.6 / 98.9 / 99.6 %), so a change
      // that drops coverage fails. Raise them by hand when the figures climb; they never go down.
      thresholds: { statements: 95.5, branches: 88, functions: 98.5, lines: 99.3 },
    },
  },
});
