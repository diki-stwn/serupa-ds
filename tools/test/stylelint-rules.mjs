// The Stylelint rules for the system's own conventions (tools/lint/stylelint-serupa.mjs): each one passes the CSS
// the components write and flags the CSS it is there to stop. npm run lint runs them over src/components/.
//   node tools/test/stylelint-rules.mjs
import path from 'node:path';
import stylelint from 'stylelint';
import { PROJECT, done, report } from './lib.mjs';

const rules = (extra = {}) => ({
  plugins: [path.join(PROJECT, 'tools', 'lint', 'stylelint-serupa.mjs')],
  rules: { 'serupa/component-layer': true, 'serupa/no-raw-value': true, 'serupa/color-through-component-token': true, 'serupa/focus-ring-outline': true, ...extra },
});
const found = async (code, extra) => (await stylelint.lint({ code, config: rules(extra) })).results[0].warnings.map((w) => w.rule);
const layered = (body) => `/* A comment may sit outside. */\n@layer dk.components {\n${body}\n}\n`;

const R = [];
const t = async (name, code, want, extra) => {
  const got = await found(code, extra);
  R.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), detail: `flagged ${JSON.stringify(got)}, expected ${JSON.stringify(want)}` });
};

await t('a component as the components write it passes', layered(`.dk-card { padding: var(--card-padding, var(--spacing-4)); color: var(--card-text, var(--text)); margin: 0; width: 1em; }
.dk-card:focus-visible { outline: var(--focus-ring-width) solid var(--card-focus-ring, var(--focus-ring)); outline-offset: var(--focus-ring-offset); }
.dk-grid { grid-template-columns: repeat(var(--dk-grid-cols), minmax(0, 1fr)); --dk-grid-gap: 12px; }
.dk-tab:focus-visible { box-shadow: inset 0 0 0 var(--focus-ring-width) var(--tabs-focus-ring, var(--focus-ring)); }
@media (min-width: 640px) { .dk-card { padding: var(--spacing-6); } }`), []);
await t('component-layer: a rule outside the layer, a second block and another layer', `.dk-x { color: var(--card-text, var(--text)); }\n@layer dk.components { }\n@layer dk.components { }\n@layer dk.utilities { }`, ['serupa/component-layer', 'serupa/component-layer', 'serupa/component-layer']);
await t('no-raw-value: px, ms and a bare number outside a var()', layered('.dk-x { min-width: 120px; transition: opacity 150ms; z-index: 10; }'), ['serupa/no-raw-value', 'serupa/no-raw-value', 'serupa/no-raw-value']);
await t('color-through-component-token: an alias and a palette step read directly', layered('.dk-x { color: var(--text); border-color: var(--blue-600); }'), ['serupa/color-through-component-token', 'serupa/color-through-component-token']);
await t('color-through-component-token with allowPalette: palette steps pass, aliases still fail', layered('.dk-x { color: var(--blue-600); background: var(--surface); }'), ['serupa/color-through-component-token'], { 'serupa/color-through-component-token': [true, { allowPalette: true }] });
await t('focus-ring-outline: a box-shadow ring on :focus-visible (not inset, not :focus-within)', layered(`.dk-x:focus-visible { box-shadow: 0 0 0 var(--focus-ring-width) var(--card-focus-ring, var(--focus-ring)); }
.dk-y:focus-within { box-shadow: 0 0 0 var(--focus-ring-width) var(--card-focus-ring, var(--focus-ring)); }`), ['serupa/focus-ring-outline']);

done(report('Stylelint rules', R));
