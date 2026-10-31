// serupa-ds/eslint (TF2), as a project uses it (npm run build first): the flat-config object that tells
// eslint-plugin-jsx-a11y what each component renders. Its map is the one our own lint uses, every name in it is a
// component the package exports (dist/components.json), and with it a project's ESLint fails <Image src> with no alt
// and passes <Image alt="">, as it does for a plain img.
//   node tools/test/eslint-export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ESLint } from 'eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import { PROJECT, report, done, fail } from './lib.mjs';
import { a11yComponents } from '../lint/a11y-components.mjs';

const file = path.join(PROJECT, 'dist', 'eslint.js');
if (!fs.existsSync(file)) fail('no dist/eslint.js: run npm run build first');
const mod = await import(pathToFileURL(file).href);
const config = mod.default;
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

const settings = config.settings || {};
t('the default export is a flat-config object with settings for jsx-a11y and its fork jsx-a11y-x, and nothing else',
  JSON.stringify(Object.keys(config).sort()) === '["name","settings"]' && JSON.stringify(settings['jsx-a11y']) === JSON.stringify(settings['jsx-a11y-x']),
  Object.keys(config).join(', '));
const map = settings['jsx-a11y']?.components || {};
t('the map is the one our own lint uses (tools/lint/a11y-components.mjs)', JSON.stringify(map) === JSON.stringify(a11yComponents(PROJECT)), 'rebuild: npm run build');
const exported = new Set(Object.values(JSON.parse(fs.readFileSync(path.join(PROJECT, 'dist', 'components.json'), 'utf8')).components).flatMap((c) => c.exports));
const unknown = Object.keys(map).filter((n) => !exported.has(n));
t('every component in the map is one the package exports (dist/components.json)', !unknown.length && Object.keys(map).length > 20, unknown.join(', ') || `${Object.keys(map).length} components`);
t('Image is an img, Link an a and IconButton a button; the polymorphic prop is as; labelAttributes is ["label"]',
  map.Image === 'img' && map.Link === 'a' && map.IconButton === 'button' && settings['jsx-a11y'].polymorphicPropName === 'as' && JSON.stringify(mod.labelAttributes) === '["label"]',
  JSON.stringify({ Image: map.Image, Link: map.Link, IconButton: map.IconButton }));

// A project's eslint.config.js: the plugin's recommended rules, then ours.
const eslint = new ESLint({
  cwd: PROJECT,
  overrideConfigFile: true,
  overrideConfig: [
    { files: ['**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { 'jsx-a11y-x': jsxA11y }, rules: jsxA11y.configs.recommended.rules },
    config,
  ],
});
const lint = async (code) => (await eslint.lintText(code, { filePath: path.join(PROJECT, 'page.jsx') }))[0].messages.map((m) => m.ruleId);
const missing = await lint('export const A = () => <Image src="team.png" />;\n');
const empty = await lint('export const A = () => <Image src="team.png" alt="" />;\n');
t('with it, a project\'s lint fails <Image src> with no alt (alt-text) and passes <Image alt="">', missing.includes('jsx-a11y-x/alt-text') && !empty.length, `no alt: ${missing.join(', ') || 'nothing'}; alt="": ${empty.join(', ') || 'nothing'}`);

done(report('serupa-ds/eslint', R));
