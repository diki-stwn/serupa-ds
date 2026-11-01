// Utility classes: renders every class in dist/bundle.css and dist/utilities-extra.css on its own and compares what it
// does (computed styles on the element and its children) with the saved baseline.
//   node tools/test/utilities.mjs            check against baseline-utilities.json
//   node tools/test/utilities.mjs --update   accept the current output as the new baseline
// Custom properties count too, so classes that only set a variable (ring colors, gradient stops) are covered.
// A change shows up as CHANGED (different effect), NEW (class added) or MISSING (class gone).
// The baseline keeps each class's effect as text ("color:rgb(…);child color:rgb(…)") when it's 200 characters or
// fewer, so a CHANGED class prints what changed, property by property; longer effects (masks, gradients, filters)
// keep a hash, and print what the class does now. The page's line height is fixed, so a font family that isn't
// installed (Inter on a laptop) changes nothing but the font-family itself.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { HERE, read, writePage, browser, cleanup, suffix, ENGINE, report, done } from './lib.mjs';

const BASE = path.join(HERE, `baseline-utilities${suffix}.json`);
const update = process.argv.includes('--update');

const css = (read('dist/bundle.css') + read('dist/utilities-extra.css')).replace(/\/\*[\s\S]*?\*\//g, '');
// CSS escapes: "\32 xl\:flex" is the class "2xl:flex" (a class can't start with a digit unescaped).
const unescape = (n) => n.replace(/\\([0-9a-f]{1,6}) ?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
const classes = [...new Set([...css.matchAll(/(?:^|[\s,}(])\.((?:[a-z0-9-]|\\[0-9a-f]{1,6} ?|\\.)+)(?=[\s{,:)>])/gim)].map((m) => unescape(m[1])))]
  .filter((c) => !c.startsWith('dk-')).sort();
// The system's own internal variables (--dk-*): browsers don't list unregistered custom properties
// in computed styles, so they're read by name.
const internal = [...new Set([...css.matchAll(/--dk-[a-z0-9-]+/g)].map((m) => m[0]))];

const b = await browser();
const page = await b.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(writePage('utilities.html', '<div id="host" style="position:relative;width:1000px;line-height:20px"></div>', { extra: true }));
await page.evaluate(() => document.fonts.ready);

const measure = ([list, internal]) => {
  const host = document.getElementById('host');
  host.innerHTML = '';
  const base = document.createElement('div'); base.innerHTML = '<i>a</i><i>b</i>'; host.appendChild(base);
  const els = list.map((c) => { const w = document.createElement('section'); w.style.position = 'relative'; w.style.transform = 'translateZ(0)';   /* contains fixed elements too, so their position doesn't depend on the class's place in the list */ const d = document.createElement('div'); d.className = c; d.innerHTML = '<i>a</i><i>b</i>'; w.appendChild(d); host.appendChild(w); return d; });
  const B = getComputedStyle(base), B1 = getComputedStyle(base.firstChild);
  const props = []; for (let j = 0; j < B.length; j++) props.push(B[j]); for (const v of internal) if (!props.includes(v)) props.push(v);
  // Chromium lists custom properties in an order that changes from run to run (--dk-mask-b-to-p came before or after
  // --dk-mask-bottom on different CI runners), so they go last, by name, and an effect reads the same on every run.
  props.sort((x, y) => (x.startsWith('--') ? 1 : 0) - (y.startsWith('--') ? 1 : 0) || (x.startsWith('--') && y.startsWith('--') ? (x < y ? -1 : x > y ? 1 : 0) : 0));
  const bv = {}, b1 = {}; props.forEach((p) => { bv[p] = B.getPropertyValue(p); b1[p] = B1.getPropertyValue(p); });
  return els.map((d) => {
    const s = getComputedStyle(d), s1 = getComputedStyle(d.firstChild); const o = [];
    props.forEach((p) => { const v = s.getPropertyValue(p); if (v !== bv[p]) o.push(p + ':' + v); const v1 = s1.getPropertyValue(p); if (v1 !== b1[p]) o.push('child ' + p + ':' + v1); });
    if (d.className.startsWith('placeholder-')) {   // ::placeholder only exists on form fields
      const inp = document.createElement('input'); inp.className = d.className; inp.placeholder = 'x'; host.appendChild(inp);
      const ref = document.createElement('input'); ref.placeholder = 'x'; host.appendChild(ref);
      const ph = getComputedStyle(inp, '::placeholder').color;
      if (ph !== getComputedStyle(ref, '::placeholder').color) o.push('placeholder color:' + ph);
    }
    return o.join(';');
  });
};

const MAX = 200;
const now = {}, text = {};
for (let i = 0; i < classes.length; i += 1000) {
  const chunk = classes.slice(i, i + 1000);
  const out = await page.evaluate(measure, [chunk, internal]);
  chunk.forEach((c, j) => {
    // -webkit- longhands repeat the standard ones (-webkit-mask-position-x and mask-position).
    const t = out[j].split(';').filter((d) => d && !/^(child )?-webkit-/.test(d)).join(';');
    text[c] = t;
    now[c] = !t ? '(no effect)' : t.length <= MAX ? t : '#' + crypto.createHash('sha1').update(t).digest('hex').slice(0, 12);
  });
}
await b.close();
cleanup();

if (update || !fs.existsSync(BASE)) {
  // A hashed effect that changes prints what it is now, so a baseline update made on CI says what it rewrote.
  const old = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
  for (const c of classes) if (c in old && old[c] !== now[c] && now[c].startsWith('#')) console.log('UPDATED  .' + c + '\n           now: ' + text[c]);
  fs.writeFileSync(BASE, JSON.stringify(now, null, 0).replace(/","/g, '",\n"'));
  console.log(`Baseline saved: ${classes.length} classes.`);
  process.exit(0);
}
const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const changed = classes.filter((c) => c in base && base[c] !== now[c]);
const added = classes.filter((c) => !(c in base));
const missing = Object.keys(base).filter((c) => !(c in now));
const noEffect = classes.filter((c) => now[c] === '(no effect)' && base[c] !== undefined && !base[c].endsWith('(no effect)'));
const parts = (v) => (v && !v.startsWith('#') && !v.endsWith('(no effect)') ? v.split(';') : []);
for (const c of changed) {
  console.log('CHANGED  .' + c);
  if (!base[c].startsWith('#') && !/^[0-9a-f]{12}( \(no effect\))?$/.test(base[c])) {   // (a baseline from before kept only hashes)
    const was = parts(base[c]), is = parts(now[c] === '(no effect)' || now[c].startsWith('#') ? text[c] : now[c]);
    for (const d of was) if (!is.includes(d)) console.log('           - ' + d);
    for (const d of is) if (!was.includes(d)) console.log('           + ' + d);
  } else console.log('           now: ' + (text[c] || '(no effect)'));   // whole, so a hash that changes shows what it hashes
}
for (const c of added) console.log('NEW      .' + c);
for (const c of missing) console.log('MISSING  .' + c + '   (removing or renaming a class is a breaking change: major version)');
for (const c of noEffect) console.log('NO EFFECT .' + c);
const ok = !changed.length && !missing.length;
console.log(`\nUtilities (${ENGINE}): ${classes.length} classes, ${changed.length} changed, ${added.length} new, ${missing.length} missing${ok ? ' — all match the baseline' : ''}`);
if (!ok) console.log('If the changes are intended, run with --update to accept them.');
done(report('Utility classes', [
  { name: `${classes.length} classes do what the baseline says`, ok: !changed.length, detail: 'changed: ' + changed.join(' ') + ' (run node tools/test/utilities.mjs --update if intended)' },
  { name: 'No class is gone (removing or renaming one is breaking)', ok: !missing.length, detail: 'missing: ' + missing.join(' ') },
]));
