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
  h(D.Toaster, null),
  h(D.Splitter, { id: 'spl', separatorLabel: 'Panes', style: { height: '300px' } },
    h('div', null, 'Left'), h('div', { id: 'spl-b' }, Array.from({ length: 60 }, function (_, i) { return h('p', { key: i, style: { margin: 0, height: '20px' } }, 'Row ' + i); })))));
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
    out: cs('#out', '::after').content, inner: cs('#in', '::after').content, plain: cs('#plain', '::after').content,
    spl: Math.round(document.getElementById('spl').getBoundingClientRect().height), pane: document.getElementById('spl-b').closest('.dk-splitter__pane').getBoundingClientRect().height >= 1200,
    sep: getComputedStyle(document.querySelector('#spl [role="separator"]')).display };
});
const screen = await read();
await p.emulateMedia({ media: 'print' });
const print = await read();
t('on screen nothing changes: the toast shows, no link addresses', screen.toaster !== 'none' && screen.out === 'none', JSON.stringify(screen));
t('printed, a primary Button and a filled Badge keep their colors (print-color-adjust: exact)', print.btn === 'exact' && print.badge === 'exact', JSON.stringify(print));
t('printed, the toast stack is left out', print.toaster === 'none', print.toaster);
t('printed, a Fab (position: fixed, so it would repeat on every page) is left out; on screen it shows', print.fab === 'none' && screen.fab !== 'none', JSON.stringify([screen.fab, print.fab]));
t('printed, data-print-urls adds an outside link\'s address after it; same-page links and links outside it get none', print.out === '" (" attr(href) ")"' || print.out === '" (https://example.com/terms)"', JSON.stringify([print.out, print.inner, print.plain]));
t('a Splitter prints its panes\' whole content: on screen 300px with the pane scrolling, printed as tall as its 60 rows with no separator (GR59)', screen.spl === 300 && !screen.pane && print.spl >= 1200 && print.pane && print.sep === 'none', JSON.stringify([screen.spl, screen.pane, print.spl, print.pane, print.sep]));
t('…and only there', print.inner === 'none' && print.plain === 'none', JSON.stringify([print.inner, print.plain]));
await b.close();
cleanup();
done(report('Print', R));
