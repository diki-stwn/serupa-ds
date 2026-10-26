// Motion in component CSS comes from the motion tokens (DY1): every duration, delay and easing in a transition or an
// animation is a var(): a role (motion-press, motion-enter-md, ease-enter, …), not a raw 250ms. A raw 250ms or cubic-bezier() is a speed of its own that no token
// change reaches. The roles must name a token of the scale, so that changing the scale moves them too.
//   node tools/test/motion-tokens.mjs
// Steps (steps(), step-end) are allowed: no token holds them, and a ticking spinner needs them.
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const MOTION = /^(?:transition|animation)(?:-(?:duration|delay|timing-function))?$|^--[\w-]*(?:duration|delay|easing|ease)$/;
const RAW_TIME = /(?<![\w.-])(?!0m?s\b)\d*\.?\d+m?s\b/g;
const RAW_EASE = /(?<![\w-])(?:linear|ease|ease-in|ease-out|ease-in-out)(?![\w-])|cubic-bezier\(/g;

// The scale itself (duration-150, ease-in-out) in component CSS (FI1): a component names what moves, with a role,
// so a change to the role reaches it. Allowed: duration-0 (no transition at all) and ease-linear (a spinner or a
// bar turning at constant speed, as the Motion page says). What still uses the scale is in KNOWN, by component,
// under the queue item that moves it onto a role; a KNOWN token no longer used fails too.
const SCALE = /var\(--((?:duration-(?!0\))\d+)|ease-(?:in-out|in|out))\)/g;
const KNOWN = Object.fromEntries(Object.entries({
  Accordion: ['duration-200', 'ease-in-out'],   // the chevron turning and the panel opening: a change in place
  Badge: ['ease-in-out', 'duration-500', 'duration-300', 'ease-out'],   // loading cross-fade, ripple
  Button: ['ease-out', 'duration-150', 'ease-in-out', 'duration-500', 'duration-300'],   // press easing, loading, nudge, ripple
  Card: ['ease-out'],   // the press
  Carousel: ['duration-300', 'ease-out', 'duration-150'],   // the slides and the dots moving
  Checkbox: ['ease-out'],   // the press
  Combobox: ['duration-150', 'ease-in-out'],   // the chevron turning
  Drawer: ['ease-out'],   // settling after a swipe
  Image: ['duration-1000', 'ease-in-out'],   // the loading pulse
  Loader: ['duration-1000', 'duration-500', 'ease-in-out', 'duration-1200', 'duration-150', 'duration-300', 'duration-75', 'duration-200', 'duration-100', 'duration-700'],   // loops
  Meter: ['duration-300', 'ease-out'],   // the fill
  PinInput: ['duration-1000', 'ease-in-out'],   // the caret blinking
  Progress: ['duration-300', 'ease-out', 'duration-1200', 'ease-in-out'],   // the fill and the indeterminate slide
  Radio: ['ease-out'],   // the press
  SegmentedControl: ['duration-200', 'ease-out'],   // the indicator sliding, the press
  Sidebar: ['duration-200', 'ease-in-out'],   // collapsing, the chevron turning
  Slider: ['duration-150', 'ease-out'],   // the thumb growing, the value bubble
  SortableList: ['duration-150'],   // rows gliding to their place
  Stepper: ['ease-out'],   // the press
  Switch: ['ease-out'],   // the press
  TreeView: ['duration-200', 'ease-in-out'],   // the chevron turning
}).flatMap(([c, ts]) => ts.map((t) => [`${c}:${t}`, 'FI1'])));

const dir = path.join(PROJECT, 'src', 'components');
const found = [];
const scale = new Map();
for (const name of fs.readdirSync(dir).sort()) {
  for (const f of fs.readdirSync(path.join(dir, name)).filter((x) => x.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(dir, name, f), 'utf8');
    // Comments out, keeping the lines so the line numbers stay right.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    for (const m of code.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
      if (!MOTION.test(m[1])) continue;
      const value = m[2].replace(/@keyframes[\s\S]*/, '');
      for (const x of value.matchAll(SCALE)) {
        const k = `${name}:${x[1]}`;
        if (!scale.has(k)) scale.set(k, `src/components/${name}/${f}:${code.slice(0, m.index).split('\n').length}`);
      }
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
  ...[...scale].map(([k, at]) => ({ name: KNOWN[k] ? `${k.replace(':', ': ')} from the scale, not a role yet (${KNOWN[k]})` : `${k.replace(':', ': ')} comes from a motion role`, ok: !!KNOWN[k],
    detail: `${at} uses var(--${k.split(':')[1]}): use the role for what moves (motion-hover with ease-move for a hover color, motion-enter-sm with ease-enter for a popup, …)` })),
  ...Object.keys(KNOWN).filter((k) => !scale.has(k)).map((k) => ({ name: `${k.replace(':', ': ')} still from the scale`, ok: false, detail: 'it uses a role now; take it out of KNOWN in tools/test/motion-tokens.mjs' })),
  { name: 'every motion role names a token of the duration or easing scale', ok: badRoles.length === 0, detail: badRoles.join(', ') },
  { name: 'each exit is shorter than its enter', ok: exitsShorter.length === 0, detail: `motion-exit-${exitsShorter.join(', motion-exit-')}` },
]));
