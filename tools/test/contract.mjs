// Component contract: every folder in src/components/ ships what the project standard asks for, so a new
// component can't pass CI with something missing. No browser needed.
//   node tools/test/contract.mjs
// Each component needs: <Name>.tsx, <Name>.css, <name>.tokens.json, <Name>.stories.tsx, <Name>.mdx, README.md,
// preview.html, a test next to it (<Name>.test.tsx, Vitest), and visual baselines of its stories in every theme.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, PROJECT, tokensCss, report, done } from './lib.mjs';

const SKIP = [];
// Parts a component doesn't need, and why. Keep the reason: an exemption without one is a gap.
const EXEMPT = {
  Icon: { tokens: 'draws in currentColor at 1em; no visual values of its own' },
  VisuallyHidden: { tokens: 'no visual values', preview: 'nothing to see', visual: 'nothing to see' },
};
// Known gaps, to be fixed. The check fails when one is fixed, so the entry gets removed and can't come back.
const GAPS = {};

const COMP = path.join(PROJECT, 'src', 'components');
const comps = fs.readdirSync(COMP).filter((c) => fs.statSync(path.join(COMP, c)).isDirectory() && !SKIP.includes(c)).sort();
const kebab = (c) => c.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const { themes } = tokensCss();
// baseline-visual/<Name>/<Story>-<theme>-<state>.png (tools/test/visual.mjs).
const baselines = (c) => { const d = path.join(HERE, 'baseline-visual', c); return fs.existsSync(d) ? fs.readdirSync(d) : []; };

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

for (const c of comps) {
  const has = (f) => fs.existsSync(path.join(COMP, c, f));
  const parts = {
    code: has(`${c}.tsx`),
    css: has(`${c}.css`),
    tokens: fs.readdirSync(path.join(COMP, c)).some((f) => f.endsWith('.tokens.json')),
    stories: has(`${c}.stories.tsx`),
    docs: has(`${c}.mdx`),
    guide: has('README.md'),
    preview: has('preview.html'),
    test: has(`${c}.test.tsx`),
    visual: themes.every((th) => baselines(c).some((f) => f.endsWith(`-${th}-rest.png`))),
  };
  const missing = [], fixed = [];
  for (const [part, ok] of Object.entries(parts)) {
    if (EXEMPT[c]?.[part]) continue;
    if (GAPS[c]?.[part]) { if (ok) fixed.push(part); continue; }
    if (!ok) missing.push(part);
  }
  const what = { code: `${c}.tsx`, css: `${c}.css`, tokens: `${kebab(c)}.tokens.json`, stories: `${c}.stories.tsx`, docs: `${c}.mdx`, guide: 'README.md', preview: 'preview.html', test: `${c}.test.tsx`, visual: `a visual baseline in each of the ${themes.length} themes (add the "update-visual-baselines" label)` };
  t(`${c} has everything a component ships with`, !missing.length && !fixed.length,
    [missing.length && `missing: ${missing.map((p) => what[p]).join(', ')}`, fixed.length && `known gap now fixed, remove it from GAPS in contract.mjs: ${fixed.join(', ')}`].filter(Boolean).join('; '));
}

// Tree-shaking: a component made with React.forwardRef(...) and a separate `X.displayName = "X"` statement can't be
// dropped by a bundler (the statement is a side effect), so every component goes through component() or named().
const unshakeable = comps.flatMap((c) => fs.readdirSync(path.join(COMP, c)).filter((f) => /^[A-Z]\w*\.tsx$/.test(f) && !/\.(test|stories)\.tsx$/.test(f))
  .filter((f) => /^\w+\.displayName = |= React\.forwardRef\b/m.test(fs.readFileSync(path.join(COMP, c, f), 'utf8'))).map((f) => `${c}/${f}`));
t('components are made with component() or named() (internal/component.ts), so unused ones drop out of a bundle', !unshakeable.length, unshakeable.join(', '));

// One focus-ring recipe (outline + outline-offset, tokens focus-ring-width and focus-ring-offset): a box-shadow ring
// outside the element paints its gap in one color, which shows as a band on tinted backgrounds. Inset rings, for
// elements whose scrolling container would clip an outline (Tabs), are allowed.
const haloRings = comps.flatMap((c) => {
  const f = path.join(COMP, c, `${c}.css`);
  if (!fs.existsSync(f)) return [];
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]*:focus(?:-visible)?[^{}]*)\{([^{}]*)\}/g)]
    .filter((m) => /box-shadow:[^;]*ring/.test(m[2]) && !/box-shadow:\s*inset/.test(m[2]) && !/:focus-within/.test(m[1]))
    .map((m) => `${c}: ${m[1].trim()}`);
});
t('focus rings are outlines (focus-ring-width, focus-ring-offset), not box-shadow rings with a painted gap', !haloRings.length, haloRings.join('; '));

console.log(`(${comps.length} components)`);
done(report('Contract', R));
