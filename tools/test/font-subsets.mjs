// Inter split by script (F6, tools/fonts/subset.py): tokens.css gives each file its unicode-range, so an English page
// downloads the latin files only, and text in every script Inter covers draws exactly as with the whole font (the
// same pixels: no glyph, feature or weight lost). Chromium.
//   node tools/test/font-subsets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, browser, read, report, done } from './lib.mjs';

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const faces = JSON.parse(read('tokens.json')).type.fonts;
t('every face in tokens.json is a file in fonts/ with a unicode-range', faces.length > 2 && faces.every((f) => f.unicodeRange && fs.existsSync(path.join(PROJECT, f.file))), faces.filter((f) => !f.unicodeRange || !fs.existsSync(path.join(PROJECT, f.file))).map((f) => f.file).join(', '));
t('tokens.css has an @font-face with its unicode-range for each', (read('tokens.css').match(/unicode-range:/g) || []).length === faces.length, `${(read('tokens.css').match(/unicode-range:/g) || []).length} of ${faces.length}`);

const dir = path.join(PROJECT, '.test-tmp');
fs.mkdirSync(dir, { recursive: true });
const b = await browser();
const p = await b.newPage({ viewport: { width: 900, height: 520 } });
const fetched = [];
p.on('request', (r) => { if (r.url().endsWith('.woff2')) fetched.push(r.url().split('/').pop()); });
fs.writeFileSync(path.join(dir, 'font-english.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../tokens.css"><body style="font-family:var(--font-sans)"><p>Save — 12.50 € … “Ready”, <b>bold</b> <i>and italic</i>.</p>');
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
const whole = `@font-face{font-family:T;src:url("../fonts/InterVariable.woff2");font-weight:100 900}@font-face{font-family:T;src:url("../fonts/InterVariable-Italic.woff2");font-weight:100 900;font-style:italic}`;
const split = faces.map((f) => `@font-face{font-family:T;src:url("../${f.file}");font-weight:${f.weight};font-style:${f.style};unicode-range:${f.unicodeRange}}`).join('');
const shot = async (name, css) => {
  fs.writeFileSync(path.join(dir, name), `<!doctype html><meta charset="utf-8"><style>${css} body{font-family:T;font-size:22px;margin:8px}</style>${text}`);
  await p.goto('file://' + path.join(dir, name));
  // A face with a unicode-range starts loading at layout, so wait for a frame before asking whether fonts are ready.
  await p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => document.fonts.ready.then(() => requestAnimationFrame(() => ok())))));
  return p.screenshot();
};
const a = await shot('font-whole.html', whole), c = await shot('font-split.html', split);
t('text in latin, cyrillic, greek and vietnamese, with features, weights and italic, draws the same pixels as with the whole font', Buffer.compare(a, c) === 0, 'the split fonts draw differently: run python3 -I tools/fonts/subset.py again');

await b.close();
fs.rmSync(dir, { recursive: true, force: true });
done(report('Font subsets', R));
