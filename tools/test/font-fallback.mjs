// "Inter Fallback" (144, tools/fonts/fallback.py): until Inter arrives, text draws in Arial (or Liberation Sans,
// which has Arial's metrics) sized like Inter, so it doesn't move when Inter swaps in. Checks, for each face in
// tokens.json's type.fallbacks (upright and italic, 400 and 700):
//   - tokens.css writes it, and --font-sans lists it right after Inter;
//   - it finds a font on this machine (Liberation Sans on Linux: playwright install-deps installs it);
//   - a line of English is within 2% of its width in Inter, and its ascent and descent (at 100px, where a pixel's
//     rounding doesn't hide them) are within a pixel of Inter's;
//   - a paragraph in a 320px column (a phone) wraps within a line of Inter's (lines within 2% of each other's width
//     can still break at another word, so the same count can't be promised), and the line is at least 3 times
//     closer to Inter's width than plain Arial's, which is what a Mac or Windows page drew before.
//   node tools/test/font-fallback.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { read, browser, report, done, PROJECT } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const tokens = JSON.parse(read('tokens.json'));
const fallbacks = tokens.type.fallbacks || [];
const css = read('tokens.css');

t('tokens.json has an Inter Fallback face for upright and italic, 400 and 700', fallbacks.length === 4
  && ['normal 400', 'normal 700', 'italic 400', 'italic 700'].every((k) => fallbacks.some((f) => `${f.style} ${f.weight}` === k)),
fallbacks.map((f) => `${f.style} ${f.weight}`).join(', '));
t('tokens.css writes each one with its size-adjust and overrides', fallbacks.every((f) => css.includes(`size-adjust: ${f.sizeAdjust};\n  ascent-override: ${f.ascentOverride};`)), '');
t('--font-sans lists Inter Fallback right after Inter', /--font-sans: Inter, "Inter Fallback",/.test(css), (/--font-sans:[^;]*/.exec(css) || [''])[0]);

// A page of its own, outside .test-tmp (other suites empty that folder while this one runs).
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-fallback-'));
const inter = fallbacks.map((f) => `@font-face{font-family:I;src:url("file://${path.join(PROJECT, f.style === 'italic' ? 'fonts/InterVariable-Italic.woff2' : 'fonts/InterVariable.woff2')}");font-weight:100 900;font-style:${f.style}}`);
const fall = fallbacks.map((f) => `@font-face{font-family:F;src:${f.local.map((n) => `local("${n}")`).join(',')};font-weight:${f.weight};font-style:${f.style};size-adjust:${f.sizeAdjust};ascent-override:${f.ascentOverride};descent-override:${f.descentOverride};line-gap-override:${f.lineGapOverride}}`);
const TEXT = 'Your changes are saved. Invite people to this project by email, then choose what each of them can see and edit.';
const PARA = 'Invite people to this project by email. Each of them gets a link that works for seven days, and you choose what they can see and edit before they join. You can change it later in Settings, under Members.';
const rows = fallbacks.map((f) => `<div data-k="${f.style} ${f.weight}" style="font-style:${f.style};font-weight:${f.weight}"><p><span class="i">${TEXT}</span><br><span class="f">${TEXT}</span></p><p class="col i">${PARA}</p><p class="col f">${PARA}</p><p><span class="s">${TEXT}</span></p></div>`).join('');
fs.writeFileSync(path.join(dir, 'page.html'), `<!doctype html><meta charset="utf-8"><style>${[...new Set(inter)].join('')}${fall.join('')}@font-face{font-family:A;src:local("Arial"),local("Liberation Sans")}@font-face{font-family:A;src:local("Arial Italic"),local("Liberation Sans Italic");font-style:italic}@font-face{font-family:A;src:local("Arial Bold"),local("Liberation Sans Bold");font-weight:700}@font-face{font-family:A;src:local("Arial Bold Italic"),local("Liberation Sans Bold Italic");font-weight:700;font-style:italic}
body{margin:8px;font-size:16px;line-height:1.5} p{width:max-content} p.col{width:320px} .i{font-family:I} .f{font-family:F} .s{font-family:A}</style>${rows}`);

const b = await browser();
const p = await b.newPage();
await p.goto('file://' + path.join(dir, 'page.html'));
const got = await p.evaluate(async () => {
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
  await document.fonts.ready;
  const faces = [...document.fonts].filter((f) => f.family === 'F').map((f) => `${f.style} ${f.weight} ${f.status}`);
  const rows = [...document.querySelectorAll('[data-k]')].map((d) => {
    const [i, f] = [d.querySelector('span.i'), d.querySelector('span.f')].map((s) => s.getBoundingClientRect());
    const [ci, cf] = ['i', 'f'].map((c) => d.querySelector(`p.col.${c}`).getBoundingClientRect().height / 24);
    const ws = d.querySelector('span.s').getBoundingClientRect().width;
    const g = document.createElement('canvas').getContext('2d');
    const metric = (family) => { g.font = `${d.style.fontStyle} ${d.style.fontWeight} 100px ${family}`; const m = g.measureText('Hxg'); return [m.fontBoundingBoxAscent, m.fontBoundingBoxDescent]; };
    return { k: d.dataset.k, wi: i.width, wf: f.width, ws, ci, cf, mi: metric('I'), mf: metric('F') };
  });
  return { faces, rows };
});
await b.close();
fs.rmSync(dir, { recursive: true, force: true });

const missing = got.faces.filter((s) => !s.endsWith('loaded'));
t('each Inter Fallback face finds a font on this machine (Arial, Helvetica, Liberation Sans or Arimo)', got.faces.length === 4 && !missing.length,
  `${missing.join(', ')}: none of its local() names is installed; on Linux, apt install fonts-liberation`);
for (const r of got.rows) {
  const off = r.wf / r.wi - 1;
  const plain = r.ws / r.wi - 1;
  t(`${r.k}: a line of English in Inter Fallback is within 2% of its width in Inter, 3 times closer than plain Arial`, Math.abs(off) <= 0.02 && Math.abs(off) * 3 <= Math.abs(plain),
    `${(off * 100).toFixed(1)}% (${r.wf.toFixed(1)} vs ${r.wi.toFixed(1)} px); plain Arial ${(plain * 100).toFixed(1)}%`);
  t(`${r.k}: its ascent and descent at 100px are within a pixel of Inter's`, Math.abs(r.mf[0] - r.mi[0]) <= 1 && Math.abs(r.mf[1] - r.mi[1]) <= 1, `${r.mf.join('/')} vs ${r.mi.join('/')} px`);
  t(`${r.k}: a paragraph in a 320px column wraps within a line of Inter's`, Math.abs(r.cf - r.ci) <= 1, `${r.cf} lines against Inter's ${r.ci}`);
}

done(report('Inter Fallback', R));
