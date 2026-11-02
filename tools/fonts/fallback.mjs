// A fallback face sized like Inter (144), so text doesn't jump when Inter arrives. tokens.css loads Inter with
// font-display: swap: until the file is in, the page draws in a font already on the device, and when Inter swaps in,
// every line changes width and the text below moves. "Inter Fallback" is Arial (or a font with Arial's metrics:
// Helvetica, Liberation Sans, Arimo) scaled with size-adjust so a line of English is as wide as in Inter, with
// Inter's ascent and descent. Next.js and Fontaine do the same.
//   node tools/fonts/fallback.mjs     measures in Chromium and writes the faces into the token source's type.fallbacks (tokens/serupa.tokens.json; then npm run tokens)
// It measures in the browser, so kerning and Inter's optical size count, as they do on a page. Arial's widths come
// from Liberation Sans, which has them glyph for glyph (it was made to): on Linux, apt install fonts-liberation.
// Run it again only when fonts/ changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// Ordinary interface English, for the average width a line is made of.
const TEXT = 'The quick brown fox jumps over the lazy dog. Settings, accounts and billing are saved when you press Save. '
  + 'Search for a name, then choose a team member from the list to add them to this project. Your password must have '
  + 'at least 12 characters. Showing 1 to 20 of 248 results. Are you sure you want to delete this file? You can undo it.';
// The names local() can match: the full names of Arial and of the fonts made with its metrics.
/** @type {Array<[string, number, string[]]>} */
const FACES = [
  ['normal', 400, ['Arial', 'Helvetica', 'Liberation Sans', 'Arimo']],
  ['normal', 700, ['Arial Bold', 'Helvetica Bold', 'Liberation Sans Bold', 'Arimo Bold']],
  ['italic', 400, ['Arial Italic', 'Helvetica Oblique', 'Liberation Sans Italic', 'Arimo Italic']],
  ['italic', 700, ['Arial Bold Italic', 'Helvetica Bold Oblique', 'Liberation Sans Bold Italic', 'Arimo Bold Italic']],
];
// A percentage with 3 decimals, rounded up: browsers round a line's ascent and descent to whole pixels, so a metric
// a hair under Inter's would make some lines a pixel shorter.
const pct = (x) => `${Number((Math.ceil(x * 1e5 - 1e-6) / 1e3).toFixed(3))}%`;

const tokensPath = path.join(ROOT, 'tokens', 'serupa.tokens.json');   // the token source; npm run tokens makes tokens.json
const source = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const tokens = source.$extensions['com.serupa'];
// Only for the latin range, the file an English page loads first: a character Inter doesn't draw (Arabic, Hebrew,
// CJK) skips Inter Fallback and goes on down the stack to the system font, as before.
const LATIN = tokens.type.fonts.find((f) => f.file === 'fonts/InterVariable-latin.woff2').unicodeRange;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serupa-fallback-'));
const url = (f) => 'file://' + path.join(ROOT, f);
fs.writeFileSync(path.join(dir, 'm.html'), `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:I;src:url("${url('fonts/InterVariable.woff2')}");font-weight:100 900}
@font-face{font-family:I;src:url("${url('fonts/InterVariable-Italic.woff2')}");font-weight:100 900;font-style:italic}
${FACES.map(([style, weight, names]) => `@font-face{font-family:A;src:${names.map((n) => `local("${n}")`).join(',')};font-weight:${weight};font-style:${style}}`).join('\n')}
</style><p>x</p>`);
// Without hinting, which rounds each advance to a whole pixel at 16px (CI's Chromium hints by default).
const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
const p = await b.newPage();
await p.goto('file://' + path.join(dir, 'm.html'));
const got = await p.evaluate(async ({ text, faces }) => {
  await Promise.all([...document.fonts].map((f) => f.load()));
  const g = document.createElement('canvas').getContext('2d');
  return faces.map(([style, weight]) => {
    const w = (family) => { g.font = `${style} ${weight} 16px ${family}`; return g.measureText(text).width; };
    // Inter's metrics, at its own 2048 units per em.
    g.font = `${style} ${weight} 2048px I`;
    const m = g.measureText('H');
    return { inter: w('I'), arial: w('A'), ascent: m.fontBoundingBoxAscent / 2048, descent: m.fontBoundingBoxDescent / 2048 };
  });
}, { text: TEXT, faces: FACES });
const lost = (await p.evaluate(() => [...document.fonts].filter((f) => f.status !== 'loaded').map((f) => `${f.family} ${f.style} ${f.weight}`)));
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
if (lost.length) { console.error(`Not found: ${lost.join(', ')}. On Linux: apt install fonts-liberation`); process.exit(1); }

tokens.type.fallbacks = FACES.map(([style, weight, names], i) => {
  // Rounded first, so the overrides divide by the size-adjust the browser reads; size-adjust scales them too.
  const size = Math.round((got[i].inter / got[i].arial) * 1e4) / 1e4;
  console.log(`${style} ${weight}: size-adjust ${pct(size)}`);
  return {
    family: 'Inter Fallback', local: names, weight: String(weight), style,
    sizeAdjust: `${Number((size * 100).toFixed(2))}%`, ascentOverride: pct(got[i].ascent / size),
    descentOverride: pct(got[i].descent / size), lineGapOverride: '0%', unicodeRange: LATIN,
  };
});
fs.writeFileSync(tokensPath, JSON.stringify(source, null, 2) + '\n');
