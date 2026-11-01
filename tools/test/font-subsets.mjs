// Inter split by script (F6, tools/fonts/subset.py): tokens.css gives each file its unicode-range, so an English page
// downloads the latin files only, and text in every script Inter covers draws exactly as with the whole font (the
// same pixels: no glyph, feature or weight lost). Chromium.
//   node tools/test/font-subsets.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PROJECT, browser, read, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const faces = JSON.parse(read('tokens.json')).type.fonts;
t('every face in tokens.json is a file in fonts/ with a unicode-range', faces.length > 2 && faces.every((f) => f.unicodeRange && fs.existsSync(path.join(PROJECT, f.file))), faces.filter((f) => !f.unicodeRange || !fs.existsSync(path.join(PROJECT, f.file))).map((f) => f.file).join(', '));
t('tokens.css has an @font-face with its unicode-range for each', (read('tokens.css').match(/unicode-range:/g) || []).length === faces.length, `${(read('tokens.css').match(/unicode-range:/g) || []).length} of ${faces.length}`);

// Its own folder, not .test-tmp/: the other suites running beside it empty that one when they finish.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-fonts-'));
const at = (f) => 'file://' + path.join(PROJECT, f);
const b = await browser();
const p = await b.newPage({ viewport: { width: 900, height: 520 } });
const fetched = [];
p.on('request', (r) => { if (r.url().endsWith('.woff2')) fetched.push(r.url().split('/').pop()); });
fs.writeFileSync(path.join(dir, 'font-english.html'), `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${at('tokens.css')}"><body style="font-family:var(--font-sans)"><p>Save — 12.50 € … “Ready”, <b>bold</b> <i>and italic</i>.</p>`);
await p.goto('file://' + path.join(dir, 'font-english.html'));
await p.evaluate(() => document.fonts.ready);
t('an English page downloads only the latin files, upright and italic', fetched.sort().join() === 'InterVariable-Italic-latin.woff2,InterVariable-latin.woff2', fetched.join(', '));

// The same text, set once with the whole fonts and once with the faces tokens.css uses. Each word keeps to one file:
// a word mixing two (Łódź: Ł and ź from latin-ext, ó and d from latin) loses the kerning between them, since a font
// kerns only its own glyphs. That is the cost of any split by unicode-range, Google Fonts' included.
const text = `<p>Hello -> world <- 1/2 3x4 ‘q’ “dq” – — … fi fl 0123456789 €£¥ © ™ ½ ±×÷ ← ↑ → ↓ ⌘ ✓ ①</p>
<p style="font-feature-settings:'tnum','ss01','cv11','zero'">1110 0O Il1 Ag</p>
<p>Привет Ӂ Ελληνικά ἄλφα Tiếng Việt ŁĞİŞČŦ ʼ ﬀ ₿ ℃ №</p>
<p style="font-style:italic;font-weight:650">Italic -> Привет Ελληνικά Tiếng ✓</p><p style="font-weight:200">Thin 2/3 Ǆ</p>`;
const whole = `@font-face{font-family:T;src:url("${at('fonts/InterVariable.woff2')}");font-weight:100 900}@font-face{font-family:T;src:url("${at('fonts/InterVariable-Italic.woff2')}");font-weight:100 900;font-style:italic}`;
const split = faces.map((f) => `@font-face{font-family:T;src:url("${at(f.file)}");font-weight:${f.weight};font-style:${f.style};unicode-range:${f.unicodeRange}}`).join('');
const shot = async (name, css) => {
  fs.writeFileSync(path.join(dir, name), `<!doctype html><meta charset="utf-8"><style>${css} body{font-family:T;font-size:22px;margin:8px}</style>${text}`);
  await p.goto('file://' + path.join(dir, name));
  // Load every face first: one with a unicode-range only starts loading when layout meets one of its characters, and
  // on a busy runner fonts.ready can settle before that.
  await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok()))); });
  return p.screenshot();
};
const a = await shot('font-whole.html', whole), c = await shot('font-split.html', split);
// Where they differ, if they do (compared in the page, on a canvas): the rows, so the line of the sample can be found.
const diff = Buffer.compare(a, c) === 0 ? '' : await p.evaluate(async ([x, y]) => {
  const load = (b64) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = 'data:image/png;base64,' + b64; });
  const [ia, ic] = await Promise.all([load(x), load(y)]);
  const pixels = (im) => { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height).data; };
  const da = pixels(ia), dc = pixels(ic);
  let n = 0, top = Infinity, bottom = -1, left = Infinity, right = -1;
  for (let i = 0; i < da.length; i += 4) {
    if (da[i] === dc[i] && da[i + 1] === dc[i + 1] && da[i + 2] === dc[i + 2]) continue;
    const px = (i / 4) % ia.width, py = Math.floor(i / 4 / ia.width);
    n++; top = Math.min(top, py); bottom = Math.max(bottom, py); left = Math.min(left, px); right = Math.max(right, px);
  }
  return n ? `${n} pixels differ, x ${left}-${right}, y ${top}-${bottom} (a line is about 48px)` : '';
}, [a.toString('base64'), c.toString('base64')]);
t('text in latin, cyrillic, greek and vietnamese, with features, weights and italic, draws the same pixels as with the whole font', !diff, `${diff}: run python3 -I tools/fonts/subset.py again`);

await b.close();
fs.rmSync(dir, { recursive: true, force: true });
done(report('Font subsets', R));
