// serupa-ds/testing, as an app's CI uses it (npm run build first): forEachTheme() draws the page in each of the six
// themes, with transitions off and the color scheme to match, and puts the page back afterwards.
//   node tools/test/testing-export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PROJECT, browser, writePage, cleanup, tokensCss, report, done, fail } from './lib.mjs';

const file = path.join(PROJECT, 'dist', 'testing.js');
if (!fs.existsSync(file)) fail('no dist/testing.js: run npm run build first');
const { THEMES, forEachTheme } = await import(pathToFileURL(file).href);
const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });

t('THEMES names the six themes tokens.css draws, in its order', JSON.stringify(THEMES) === JSON.stringify(tokensCss().themes), `${THEMES} against ${tokensCss().themes}`);

const b = await browser();
const page = await b.newPage();
await page.goto(writePage('testing-export.html', '<div id="card" style="background:var(--surface);color:var(--text);transition:background 2s;width:100px;height:40px">Card</div>',
  { htmlAttrs: 'data-brand="violet" data-mode="light"' }));
const seen = [];
await forEachTheme(page, async () => {
  seen.push(await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    look: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() + ' ' + getComputedStyle(document.getElementById('card')).backgroundColor,
    transition: getComputedStyle(document.getElementById('card')).transitionDuration,
    dark: matchMedia('(prefers-color-scheme: dark)').matches,
  })));
});
t('fn runs once for each theme, in order, with the page drawn in it', JSON.stringify(seen.map((s) => s.theme)) === JSON.stringify(THEMES), seen.map((s) => s.theme).join(', '));
t('each theme draws differently (primary color and surface)', new Set(seen.map((s) => s.look)).size === THEMES.length, seen.map((s) => s.look).join(' | '));
t('transitions are off while it runs, so a picture never catches a fade', seen.every((s) => s.transition === '0s'), seen.map((s) => s.transition).join(', '));
t('prefers-color-scheme matches each theme', seen.every((s) => s.dark === s.theme.endsWith('-dark')), seen.map((s) => `${s.theme} ${s.dark}`).join(', '));
const after = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), still: !!document.getElementById('serupa-testing-still'), transition: getComputedStyle(document.getElementById('card')).transitionDuration }));
t('afterwards the page is as it was: no data-theme it didn\'t have, transitions back', after.theme === null && !after.still && after.transition === '2s', JSON.stringify(after));

await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'emerald-dark'));
const some = [];
let thrown = null;
try { await forEachTheme(page, (theme) => { some.push(theme); if (theme === 'blue-dark') throw new Error('picture differs'); }, { themes: ['violet-light', 'blue-dark', 'blue-light'] }); } catch (e) { thrown = e.message; }
const kept = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
t('themes picks some, in its order; a throw in fn stops there, comes out, and the page still gets its own theme back', some.join() === 'violet-light,blue-dark' && thrown === 'picture differs' && kept === 'emerald-dark', `${some} / ${thrown} / ${kept}`);

let unknown = '';
try { await forEachTheme(page, () => {}, { themes: ['blue-light', 'red-dark'] }); } catch (e) { unknown = e.message; }
t('a theme that doesn\'t exist is an error that lists the six', /no theme called red-dark/.test(unknown) && unknown.includes('emerald-dark'), unknown);

const still = [];
await forEachTheme(page, async () => { still.push(await page.evaluate(() => getComputedStyle(document.getElementById('card')).transitionDuration)); }, { themes: ['blue-light'], still: false });
t('still: false leaves transitions on', still[0] === '2s', still.join());

await b.close();
cleanup();
done(report('serupa-ds/testing', R));
