// Custom icons in the browser: builds two sample SVGs with tools/icons/build.mjs into a scratch copy of
// the source and bundles it, then checks Icon and Button draw them like the Material Symbols (size, color, alignment,
// accessibility, loading), that they draw with Trusted Types on, and that every other name still comes from Material Symbols.
//   node tools/test/icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECT, writePage, browser, cleanup, report, done } from './lib.mjs';

const TMP = path.join(PROJECT, '.test-tmp');
const proj = path.join(TMP, 'iconproj');
const src = path.join(TMP, 'iconsrc');
fs.mkdirSync(proj, { recursive: true });
fs.mkdirSync(src, { recursive: true });
// a scratch copy of the source, so the icons are built into it and not into the real one
fs.cpSync(path.join(PROJECT, 'src'), path.join(proj, 'src'), { recursive: true });
for (const f of ['package.json', 'tsup.config.mjs']) fs.copyFileSync(path.join(PROJECT, f), path.join(proj, f));
// a filled icon as Figma exports it, and an outlined one
fs.writeFileSync(path.join(src, 'test-square.svg'), '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H22V22H2Z" fill="#1E1E1E"/></svg>');
fs.writeFileSync(path.join(src, 'test-ring.svg'), '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/></svg>');
const built = spawnSync(process.execPath, [path.join(PROJECT, 'tools', 'icons', 'build.mjs'), '--project', proj, src], { encoding: 'utf8' });
// then the browser script, as npm run build makes it
const bundled = spawnSync(process.execPath, [path.join(PROJECT, 'node_modules', 'tsup', 'dist', 'cli-default.js')], { cwd: proj, encoding: 'utf8', env: { ...process.env, SERUPA_BUILD: 'iife' } });

const libs = ['dist/lib/react.production.min.js', 'dist/lib/react-dom.production.min.js'].map((s) => `<script src="../${s}"></script>`).join('') + '<script src="iconproj/dist/serupa.iife.js"></script>';
const APP = `<div id="root"></div>
<script>
var D = window.Serupa, h = React.createElement;
ReactDOM.createRoot(document.getElementById('root')).render(h('div', null,
  h('p', { id: 'line', style: { fontSize: '16px', lineHeight: '24px', color: 'rgb(200, 30, 40)' } }, 'Text ', h(D.Icon, { id: 'fontinline', name: 'home' }), ' and ', h(D.Icon, { id: 'custominline', name: 'test-square' })),
  h(D.Icon, { id: 'deco', name: 'test-square' }),
  h(D.Icon, { id: 'big', name: 'test-square', size: 40 }),
  h(D.Icon, { id: 'labelled', name: 'test-ring', 'aria-label': 'Status' }),
  h(D.Icon, { id: 'font', name: 'add' }),
  h(D.Icon, { id: 'proto', name: 'constructor' }),
  h('div', { 'data-theme': 'violet-dark', style: { color: 'var(--primary)' } }, h(D.Icon, { id: 'themed', name: 'test-ring' })),
  h(D.Button, { id: 'btn', leftIcon: 'test-square' }, 'Custom'),
  h(D.Button, { id: 'btnf', leftIcon: 'add' }, 'Font'),
  h(D.Button, { id: 'only', icon: 'test-ring', 'aria-label': 'Ring', size: 'lg' }),
  h(D.Button, { id: 'busy', leftIcon: 'test-square', loading: true }, 'Busy')));
</script>`;

const b = await browser();
const p = await b.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(writePage('icons.html', APP, { extraHead: libs }));
await p.waitForTimeout(500);
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

t('build.mjs builds the two sample icons', built.status === 0, built.stdout + built.stderr);
t('npm run build bundles them into the browser script', bundled.status === 0, bundled.stdout + bundled.stderr);
t('Serupa.customIcons lists them', JSON.stringify(await p.evaluate(() => window.Serupa.customIcons)) === '["test-ring","test-square"]');
const info = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const box = (s) => { const r = q(s).getBoundingClientRect(); return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; };
  const svg = q('#deco svg'), path = q('#deco svg path');
  const fi = q('#fontinline').getBoundingClientRect(), ci = q('#custominline').getBoundingClientRect();
  return {
    tag: q('#deco').tagName, cls: q('#deco').className, text: q('#deco').textContent, svgHidden: svg.getAttribute('aria-hidden'), focusable: svg.getAttribute('focusable'),
    deco: box('#deco'), svgBox: box('#deco svg'), big: box('#big'), fill: getComputedStyle(path).fill, color: getComputedStyle(q('#deco')).color,
    lineFill: getComputedStyle(q('#custominline svg path')).fill, lineColor: getComputedStyle(q('#line')).color,
    inline: [Math.round(fi.top * 10) / 10, Math.round(ci.top * 10) / 10, Math.round(fi.height * 10) / 10, Math.round(ci.height * 10) / 10],
    decoHidden: q('#deco').getAttribute('aria-hidden'), lRole: q('#labelled').getAttribute('role'), lLabel: q('#labelled').getAttribute('aria-label'), lHidden: q('#labelled').getAttribute('aria-hidden'),
    ringStroke: getComputedStyle(q('#labelled circle')).stroke, ringFill: getComputedStyle(q('#labelled circle')).fill,
    themedStroke: getComputedStyle(q('#themed circle')).stroke, themedColor: getComputedStyle(q('#themed')).color,
    font: [q('#font').dataset.icon, q('#font svg')?.getAttribute('viewBox'), q('#font').className], proto: [q('#proto').className, !!q('#proto svg')],
    btnIcon: box('#btn .dk-btn__icon .dk-icon'), btnFontIcon: box('#btnf .dk-btn__icon .dk-icon'), btnH: box('#btn')[1], btnfH: box('#btnf')[1],
    onlyIcon: box('#only .dk-icon'), only: box('#only'),
    busyIconOpacity: getComputedStyle(q('#busy .dk-btn__icon')).opacity, busySpinner: !!q('#busy .dk-btn__spinner'),
  };
});
t('a custom name renders an inline SVG (no ligature text) in a .dk-icon span', info.tag === 'SPAN' && /dk-icon--custom/.test(info.cls) && info.text === '' , JSON.stringify([info.cls, info.text]));
t('the SVG is hidden from assistive tech and not focusable', info.svgHidden === 'true' && info.focusable === 'false');
t('sized like the Material Symbols: 24px by default, the SVG fills the box', info.deco.join() === '24,24' && info.svgBox.join() === '24,24', JSON.stringify([info.deco, info.svgBox]));
t('size={40} makes it 40px', info.big.join() === '40,40', JSON.stringify(info.big));
t('drawn in the text color (currentColor)', info.fill === info.color, JSON.stringify([info.fill, info.color]));
t('inline in text: takes the paragraph color', info.lineFill === info.lineColor, JSON.stringify([info.lineFill, info.lineColor]));
t('inline in text: same box and line position as a Material Symbol', info.inline[0] === info.inline[1] && info.inline[2] === info.inline[3], JSON.stringify(info.inline));
t('decorative by default (aria-hidden)', info.decoHidden === 'true');
t('aria-label makes it an image with that name', info.lRole === 'img' && info.lLabel === 'Status' && info.lHidden === null);
t('outlined icons: strokes in the text color, no fill', info.ringFill === 'none' && info.ringStroke === info.color, JSON.stringify([info.ringStroke, info.ringFill]));
t('inside a nested theme it follows that theme\'s colors', info.themedStroke === info.themedColor && info.themedColor !== info.color, JSON.stringify([info.themedStroke, info.themedColor]));
t('other names still come from Material Symbols (an SVG on the 960 grid)', info.font[0] === 'add' && info.font[1] === '0 -960 960 960' && info.font[2] === 'dk-icon', JSON.stringify(info.font));
t('names like "constructor" are not mistaken for custom icons or Material Symbols (an empty box)', info.proto[0] === 'dk-icon' && !info.proto[1], JSON.stringify(info.proto));
t('Button leftIcon: same size as a Material Symbol (16px in md), same button height', info.btnIcon.join() === info.btnFontIcon.join() && info.btnIcon.join() === '16,16' && info.btnH === info.btnfH, JSON.stringify([info.btnIcon, info.btnFontIcon, info.btnH, info.btnfH]));
t('Button icon-only (lg): 20px icon in a 44px square', info.onlyIcon.join() === '20,20' && info.only.join() === '44,44', JSON.stringify([info.onlyIcon, info.only]));
t('Button loading: the custom icon hides behind the centered spinner', info.busyIconOpacity === '0' && info.busySpinner, info.busyIconOpacity);
// pixels: the square really paints, in the text color (read back the screenshot's center pixel)
const shot = (await p.locator('#big').screenshot()).toString('base64');
const px = await p.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(img.width >> 1, img.height >> 1, 1, 1).data;
  return [`rgb(${d[0]}, ${d[1]}, ${d[2]})`, getComputedStyle(document.getElementById('big')).color];
}, shot);
t('the icon actually paints, in the text color (center pixel)', px[0] === px[1], JSON.stringify(px));
t('no page errors', errors.length === 0, errors.join('; '));

// With Trusted Types on, custom icons draw with no policy: Icon builds their shapes as elements, never as HTML.
const tt = await b.newPage();
const ttErrors = [];
tt.on('pageerror', (e) => ttErrors.push(e.message));
await tt.goto(writePage('icons-tt.html', `<div id="root"></div><script>
var V = []; document.addEventListener('securitypolicyviolation', function (e) { V.push(e.effectiveDirective + ' ' + e.sample); });
var D = window.Serupa, h = React.createElement;
ReactDOM.createRoot(document.getElementById('root')).render(h('div', null, h(D.Icon, { id: 'sq', name: 'test-square' }), h(D.Icon, { id: 'ring', name: 'test-ring' })));
</script>`, { extraHead: `<meta http-equiv="Content-Security-Policy" content="require-trusted-types-for 'script'">${libs}` }));
await tt.waitForTimeout(300);
const ttInfo = await tt.evaluate(() => ({ on: (() => { try { document.createElement('div').innerHTML = '<b></b>'; return false; } catch { return true; } })(), V: window.V,
  sq: document.querySelector('#sq svg path')?.getAttribute('d'), ring: document.querySelector('#ring svg g')?.getAttribute('stroke-width'), circle: !!document.querySelector('#ring svg g circle') }));
t('with Trusted Types on, custom icons draw with no policy and no violation (shapes, an outline and its group)', ttInfo.on && !ttInfo.V.length && !ttErrors.length && ttInfo.sq === 'M2 2H22V22H2Z' && ttInfo.ring === '2' && ttInfo.circle, JSON.stringify([ttInfo, ttErrors]));

await b.close();
cleanup();
done(report('Custom icons', R));
