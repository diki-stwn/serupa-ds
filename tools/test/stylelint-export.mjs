// serupa-ds/stylelint, as a project uses it (npm run build first): `extends: ["serupa-ds/stylelint"]` turns on three
// rules that flag a color, a spacing length or a radius written out where a token belongs, and pass the same CSS
// written with tokens, var() fallbacks and calc() over tokens included.
//   node tools/test/stylelint-export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import stylelint from 'stylelint';
import { PROJECT, done, fail, report } from './lib.mjs';

const file = path.join(PROJECT, 'dist', 'stylelint.js');
if (!fs.existsSync(file)) fail('no dist/stylelint.js: run npm run build first');
const config = (await import(pathToFileURL(file).href)).default;
const R = [];
const found = async (code) => (await stylelint.lint({ code, codeFilename: path.join(PROJECT, 'app.css'), config: { extends: [file] } })).results[0].warnings.map((w) => `${w.rule} ${w.text.split(' in ')[0]}`);
const t = async (name, code, want) => {
  const got = await found(code);
  R.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), detail: `flagged ${JSON.stringify(got)}, expected ${JSON.stringify(want)}` });
};

R.push({ name: 'the config turns on the three rules it ships, and nothing else', ok: JSON.stringify(Object.keys(config.rules).sort()) === JSON.stringify(['serupa/no-raw-color', 'serupa/no-raw-radius', 'serupa/no-raw-spacing']) && config.plugins.length === 3, detail: Object.keys(config.rules).join(', ') });
await t('CSS written with tokens passes', `.card { color: var(--text); background: var(--surface-raised, #fff); border: var(--border-width-1, 1px) solid var(--border);
  padding: var(--spacing-4) calc(var(--spacing-4) * 2); margin: 0 auto; gap: var(--spacing-2); inset: 0; border-radius: var(--rounded-md);
  outline-color: currentcolor; fill: transparent; background-image: url("data:image/svg+xml;utf8,<svg fill='red'/>"); width: 320px;
  --brand-ink: #123456; font-family: "Gray Sans", sans-serif; }
.avatar { border-radius: var(--rounded-full); border-top-left-radius: 0; }`, []);
await t('no-raw-color: a hex, rgb(), oklch() and a named color', '.a { color: #333; background: rgb(0 0 0 / 50%); border-color: oklch(70% 0.1 250); outline-color: Red; }',
  ['serupa/no-raw-color #333', 'serupa/no-raw-color rgb()', 'serupa/no-raw-color oklch()', 'serupa/no-raw-color Red']);
await t('no-raw-color: a raw color next to a token in a shorthand', '.a { border: 1px solid #ddd; box-shadow: 0 1px 2px black, var(--shadow-sm); }',
  ['serupa/no-raw-color #ddd', 'serupa/no-raw-color black']);
await t('no-raw-spacing: px and rem in padding, margin, gap and inset (0 passes)', '.a { padding: 12px 0; margin-inline-start: -0.5rem; gap: 10px; inset-block-start: 4px; padding-top: 0px; }',
  ['serupa/no-raw-spacing 12px', 'serupa/no-raw-spacing -0.5rem', 'serupa/no-raw-spacing 10px', 'serupa/no-raw-spacing 4px']);
await t('no-raw-color: a named color is a name outside the properties that take a color', '.a { grid-area: tan; animation-name: orange; font-family: Gold, serif; view-transition-name: red; -webkit-text-stroke-color: red; }',
  ['serupa/no-raw-color red']);
await t('no-raw-spacing: a percentage, viewport or container unit has no token and passes', '.a { inset: 50%; padding: max(var(--spacing-2), 1vw); margin-block: 2dvh 5cqi; gap: 3px 10%; }',
  ['serupa/no-raw-spacing 3px']);
await t('no-raw-radius: a length or percentage in border-radius and its longhands', '.a { border-radius: 6px; border-end-start-radius: 50%; }',
  ['serupa/no-raw-radius 6px', 'serupa/no-raw-radius 50%']);
await t('a stylelint-disable comment with a reason turns a rule off for that line', '.a {\n  /* stylelint-disable-next-line serupa/no-raw-color -- the brand file asks for this exact ink */\n  color: #0a2540;\n}', []);

done(report('serupa-ds/stylelint', R));
