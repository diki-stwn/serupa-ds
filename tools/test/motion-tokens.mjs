// Motion in component CSS comes from the motion tokens (DY1): every duration, delay and easing in a transition or an
// animation is a var(), the roles (motion-press, motion-enter-md, ease-enter, …) or the scales (duration-150,
// ease-out) until a component moves to the roles. A raw 250ms or cubic-bezier() is a speed of its own that no token
// change reaches. The roles must name a token of the scale, so that changing the scale moves them too.
//   node tools/test/motion-tokens.mjs
// Steps (steps(), step-end) are allowed: no token holds them, and a ticking spinner needs them.
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const MOTION = /^(?:transition|animation)(?:-(?:duration|delay|timing-function))?$|^--[\w-]*(?:duration|delay|easing|ease)$/;
const RAW_TIME = /(?<![\w.-])(?!0m?s\b)\d*\.?\d+m?s\b/g;
const RAW_EASE = /(?<![\w-])(?:linear|ease|ease-in|ease-out|ease-in-out)(?![\w-])|cubic-bezier\(/g;

const dir = path.join(PROJECT, 'src', 'components');
const found = [];
for (const name of fs.readdirSync(dir).sort()) {
  for (const f of fs.readdirSync(path.join(dir, name)).filter((x) => x.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(dir, name, f), 'utf8');
    // Comments out, keeping the lines so the line numbers stay right.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    for (const m of code.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
      if (!MOTION.test(m[1])) continue;
      const value = m[2].replace(/@keyframes[\s\S]*/, '');
      const raw = [...value.matchAll(RAW_TIME), ...value.matchAll(RAW_EASE)].map((x) => x[0].replace('(', ''));
      if (raw.length) found.push(`src/components/${name}/${f}:${code.slice(0, m.index).split('\n').length} ${m[1]}: ${raw.join(', ')}`);
    }
  }
}

const tokens = JSON.parse(fs.readFileSync(path.join(PROJECT, 'tokens.json'), 'utf8')).transitions.tokens;
const names = new Set(tokens.map((t) => t.name));
const ROLES = ['motion-press', 'motion-hover', 'motion-enter-sm', 'motion-enter-md', 'motion-enter-lg', 'motion-exit-sm', 'motion-exit-md', 'motion-exit-lg', 'motion-loop-spinner', 'motion-loop-placeholder', 'ease-enter', 'ease-exit', 'ease-move'];
const roles = ROLES.map((r) => [r, tokens.find((t) => t.name === r)]);
const badRoles = roles.filter(([, t]) => !t || !/^\{(?:duration|ease)-[\w-]+\}$/.test(t.value) || !names.has(t.value.slice(1, -1))).map(([r, t]) => `${r}: ${t ? t.value : 'missing'}`);
const value = (n) => { const t = tokens.find((x) => x.name === n); const v = t.value.slice(1, -1); return parseInt(tokens.find((x) => x.name === v)?.value, 10); };
const exitsShorter = ['sm', 'md', 'lg'].filter((s) => !(badRoles.length === 0 && value(`motion-exit-${s}`) < value(`motion-enter-${s}`)));

done(report('Motion tokens', [
  { name: 'component CSS takes its durations, delays and easings from the motion tokens', ok: found.length === 0, detail: `raw values: ${found.join(' | ')}. Use a motion role (motion-enter-sm, ease-enter, …) or a duration-*/ease-* token` },
  { name: 'every motion role names a token of the duration or easing scale', ok: badRoles.length === 0, detail: badRoles.join(', ') },
  { name: 'each exit is shorter than its enter', ok: exitsShorter.length === 0, detail: `motion-exit-${exitsShorter.join(', motion-exit-')}` },
]));
