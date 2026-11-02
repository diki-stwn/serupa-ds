#!/usr/bin/env node
// Start a new app with Serupa set up (135): Vite, React and TypeScript, the stylesheets in order, theme.js first in
// <head> so the page never flashes the wrong theme, a skip link and main landmark, a theme switch, a small form,
// and serupaPurge() so `npm run build` ships only the classes the app uses.
//
// usage:  npx --package=github:diki-stwn/serupa-ds#v<version> serupa-create <folder> [--brand blue|violet|emerald]
//
// The folder must be new or empty. The app installs this same release of serupa-ds (its tag, as the README's install
// line does), and the React, Vite and TypeScript versions this release was tested with. --serupa <spec> installs
// another one instead (a tarball, a path), which the package's own tests use.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The versions the repository tests with: tools/test/create-app.mjs fails when they drift from its devDependencies.
export const VERSIONS = {
  react: '19.3.1',
  'react-dom': '19.3.1',
  vite: '8.3.5',
  typescript: '7.0.2',
  '@types/react': '19.3.0',
  '@types/react-dom': '19.3.0',
  '@types/node': '26.6.5',
};
const BRANDS = ['blue', 'violet', 'emerald'];

/**
 * The app's files, by path.
 * @param {{ name: string, serupa: string, brand: string }} o
 * @returns {Record<string, string>}
 */
export function files({ name, serupa, brand }) {
  const title = name.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const json = (v) => JSON.stringify(v, null, 2) + '\n';
  return {
    'package.json': json({
      name,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview', typecheck: 'tsc --noEmit' },
      dependencies: { react: VERSIONS.react, 'react-dom': VERSIONS['react-dom'], 'serupa-ds': serupa },
      devDependencies: { '@types/node': VERSIONS['@types/node'], '@types/react': VERSIONS['@types/react'], '@types/react-dom': VERSIONS['@types/react-dom'], typescript: VERSIONS.typescript, vite: VERSIONS.vite },
    }),
    'index.html': `<!doctype html>
<html lang="en" data-brand="${brand}" data-mode="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
    'vite.config.ts': `import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { serupaPurge } from 'serupa-ds/purge';

// theme.js has to run before the first paint, so it is a plain script first in <head>, not part of the bundle.
// This serves it in development and copies it into the build, from the installed serupa-ds.
const themeFile = fileURLToPath(import.meta.resolve('serupa-ds/theme.js'));
function serupaTheme(): Plugin {
  let base = '/';
  return {
    name: 'serupa-theme',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use('/serupa-theme.js', (_req, res) => {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(fs.readFileSync(themeFile));
      });
    },
    transformIndexHtml: () => [{ tag: 'script', attrs: { src: \`\${base}serupa-theme.js\` }, injectTo: 'head-prepend' }],
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'serupa-theme.js', source: fs.readFileSync(themeFile, 'utf8') }); },
  };
}

// serupaPurge() trims Serupa's stylesheets in \`vite build\` to the classes your code uses; the dev server keeps them all.
export default defineConfig({
  plugins: [serupaTheme(), serupaPurge()],
  build: {
    rollupOptions: {
      // The components' "use client" lines are for React Server Components; a browser bundle doesn't need them kept.
      onwarn(warning, warn) { if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning); },
    },
  },
});
`,
    'tsconfig.json': json({
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        isolatedModules: true,
        types: ['vite/client', 'node'],
      },
      include: ['src', 'vite.config.ts'],
    }),
    'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'serupa-ds/tokens.css';
import 'serupa-ds/base.css';
import 'serupa-ds/bundle.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
`,
    'src/App.tsx': `import { useEffect, useState } from 'react';
import { Button, Card, Container, Field, Heading, Input, SegmentedControl, SkipLink, Stack, Text, announce } from 'serupa-ds';
import type { ThemeMode } from 'serupa-ds';

// theme.js (first in <head>) follows the visitor's light or dark setting and remembers a choice made here.
function ThemeSwitch() {
  const [mode, setMode] = useState<ThemeMode>(() => window.Serupa?.theme?.get().mode ?? 'auto');
  useEffect(() => window.Serupa?.theme?.onChange((info) => setMode(info.mode)), []);
  return (
    <SegmentedControl
      aria-label="Theme"
      value={mode}
      onValueChange={(value) => window.Serupa?.theme?.set({ mode: value as ThemeMode })}
      options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
    />
  );
}

export function App() {
  const [email, setEmail] = useState('');
  return (
    <>
      <SkipLink />
      <Container as="header" className="flex items-center justify-between gap-4 py-4">
        <Text as="span" weight="semibold">${title}</Text>
        <ThemeSwitch />
      </Container>
      <Container as="main" id="main" size="prose" className="py-8">
        <Stack gap={6}>
          <Heading level={1}>${title}</Heading>
          <Text>Edit src/App.tsx to start. The components and what each is for are in node_modules/serupa-ds/README.md.</Text>
          <Card>
            <form onSubmit={(e) => { e.preventDefault(); announce(\`Signed up \${email}\`); }}>
              <Stack gap={4}>
                <Field label="Email" required>
                  <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Button type="submit" className="self-start">Sign up</Button>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
`,
    '.gitignore': 'node_modules\ndist\n',
    'README.md': `# ${title}

Made with \`serupa-create\`: React, Vite and TypeScript, with the Serupa design system set up.

- \`npm run dev\` starts it at http://localhost:5173
- \`npm run build\` builds it into \`dist/\`, with Serupa's CSS trimmed to the classes the app uses
- \`npm run typecheck\` checks the types

To update Serupa, change the tag of \`serupa-ds\` in \`package.json\`, run \`npm install\`, and read its CHANGELOG.md entries in between.
`,
  };
}

function main(argv) {
  const opt = (flag) => { const i = argv.indexOf(flag); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const brand = opt('--brand') ?? 'blue';
  let serupa = opt('--serupa');
  const [dir] = argv;
  if (!dir || dir.startsWith('-')) { console.error('usage: serupa-create <folder> [--brand blue|violet|emerald]'); return 2; }
  if (!BRANDS.includes(brand)) { console.error(`--brand is one of ${BRANDS.join(', ')}, not "${brand}"`); return 2; }
  const target = path.resolve(dir);
  if (fs.existsSync(target) && fs.readdirSync(target).length) { console.error(`${dir} isn't empty: pick a new folder.`); return 1; }
  const name = path.basename(target).toLowerCase().replace(/[^a-z0-9-._~]+/g, '-').replace(/^[-._]+/, '') || 'app';
  if (!serupa) {
    const pkg = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));
    const repo = pkg.repository.url.replace(/^git\+https:\/\/github\.com\//, '').replace(/\.git$/, '');
    serupa = `github:${repo}#v${pkg.version}`;
  }
  for (const [file, text] of Object.entries(files({ name, serupa, brand }))) {
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    fs.writeFileSync(path.join(target, file), text);
  }
  console.log(`Made ${dir}. Next:\n\n  cd ${dir}\n  npm install\n  npm run dev\n`);
  return 0;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
