// Print: browsers drop backgrounds when printing, so a primary Button printed as faint text on white and filled
// Badges lost their color. With print media, filled controls keep their colors (print-color-adjust: exact), the
// toast stack, open tooltips and menus and a Fab don't print, and data-print-urls prints outside links' addresses.
//   node tools/test/print.mjs
import { writePage, browser, cleanup, report, done } from './lib.mjs';

const APP = `<div id="root"></div>
<script>
var D = window.Serupa, h = React.createElement;
ReactDOM.createRoot(document.getElementById('root')).render(h('div', null,
  h(D.Button, { id: 'btn' }, 'Pay'), h(D.Badge, { id: 'badge', tone: 'success', variant: 'solid' }, 'Paid'),
  h('p', { id: 'urls', 'data-print-urls': '' }, h('a', { id: 'out', href: 'https://example.com/terms' }, 'Terms'), ' ', h('a', { id: 'in', href: '#top' }, 'Top')),
  h('a', { id: 'plain', href: 'https://example.com/' }, 'Home'),
  h(D.Fab, { id: 'fab', icon: 'add', label: 'New' }),
  h(D.Toaster, null)));
setTimeout(function () { D.toast('Saved'); }, 0);
</script>`;

const R = [];
const t = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const b = await browser();
const p = await b.newPage();
await p.goto(writePage('print.html', APP, { react: true, base: true }));
await p.waitForSelector('.dk-toast');
const read = () => p.evaluate(() => {
  const cs = (s, pseudo) => getComputedStyle(document.querySelector(s), pseudo);
  return { btn: cs('#btn').printColorAdjust, badge: cs('#badge').printColorAdjust, toaster: cs('.dk-toaster').display, fab: cs('#fab').display,
    out: cs('#out', '::after').content, inner: cs('#in', '::after').content, plain: cs('#plain', '::after').content };
});
const screen = await read();
await p.emulateMedia({ media: 'print' });
const print = await read();
t('on screen nothing changes: the toast shows, no link addresses', screen.toaster !== 'none' && screen.out === 'none', JSON.stringify(screen));
t('printed, a primary Button and a filled Badge keep their colors (print-color-adjust: exact)', print.btn === 'exact' && print.badge === 'exact', JSON.stringify(print));
t('printed, the toast stack is left out', print.toaster === 'none', print.toaster);
t('printed, a Fab (position: fixed, so it would repeat on every page) is left out; on screen it shows', print.fab === 'none' && screen.fab !== 'none', JSON.stringify([screen.fab, print.fab]));
t('printed, data-print-urls adds an outside link\'s address after it; same-page links and links outside it get none', print.out === '" (" attr(href) ")"' || print.out === '" (https://example.com/terms)"', JSON.stringify([print.out, print.inner, print.plain]));
t('…and only there', print.inner === 'none' && print.plain === 'none', JSON.stringify([print.inner, print.plain]));
await b.close();
cleanup();
done(report('Print', R));
