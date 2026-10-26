import * as React from 'react';
import { flushSync } from 'react-dom';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, withMotion } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Dialog } from '../Dialog/Dialog';
import { topModal } from '../../internal/layers';
import { Popover } from '../Popover/Popover';
import { Drawer, type DrawerProps } from './Drawer';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const drw = () => el('drw') as HTMLDialogElement;
const panel = (id = 'drw') => el(id).querySelector('.dk-drawer__panel') as HTMLElement;
const isOpen = () => drw().open;
// The title is the element that names the dialog (aria-labelledby).
const titleOf = (id: string) => document.getElementById(el(id).getAttribute('aria-labelledby')!) as HTMLElement;
const box = () => { const r = panel().getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
// The panel slides in: read positions once every finite animation has ended (headless WebKit can start it late).
const settled = () => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));

type Ctl = { setOpen: (v: boolean) => void; setSide: (s: DrawerProps['side']) => void; setSize: (s: DrawerProps['size']) => void; setBd: (v: boolean) => void };
function App(props: { asks: boolean[]; ctl: Partial<Ctl>; dref?: React.Ref<HTMLDialogElement>; why?: string[] }) {
  const [open, setOpen] = React.useState(false), [side, setSide] = React.useState<DrawerProps['side']>('right'), [size, setSize] = React.useState<DrawerProps['size']>('md'), [bd, setBd] = React.useState(true);
  Object.assign(props.ctl, { setOpen, setSide, setSize, setBd });
  const rows = []; for (let i = 0; i < 60; i++) rows.push(<p key={i}>Row {i}</p>);
  return <div style={{ height: '2000px' }}>
    <Button id="opener" onClick={() => setOpen(true)}>Filters</Button>
    <button id="behind">Behind</button>
    <Drawer id="drw" open={open} side={side} size={size} closeOnBackdrop={bd} onOpenChange={(v, d) => { props.asks.push(v); if (props.why) props.why.push(d.reason); setOpen(v); }} title="Filters" description="Narrow the list." ref={props.dref} className="extra"
      footer={[<Button key={1} variant="secondary">Reset</Button>, <Button key={2} id="apply">Apply</Button>]}>
      <Input id="q" aria-label="Search" />{rows}
    </Drawer>
  </div>;
}
const openDrw = async () => { await userEvent.click(el('opener')); await expect.poll(() => isOpen()).toBe(true); await settled(); };
const reopen = async (ctl: Partial<Ctl>, fn: () => void) => {
  React.act(() => ctl.setOpen!(false));
  React.act(fn);
  React.act(() => ctl.setOpen!(true));
  await expect.poll(() => isOpen()).toBe(true);
  await settled();
};

describe('Drawer', () => {
  beforeEach(async () => { await page.viewport(1000, 700); });
  afterAll(async () => { await page.viewport(900, 700); });

  test('closed at first: not shown', async () => {
    await render(<App asks={[]} ctl={{}} />);
    expect([isOpen(), getComputedStyle(drw()).display]).toEqual([false, 'none']);
  });

  test('open: a modal <dialog> named by the title and described by the description, focus inside; ref and className reach it; right, md (default): 384px wide, full height, against the right edge; the page behind doesn\'t scroll and can\'t be clicked', async () => {
    const ref = React.createRef<HTMLDialogElement>();
    await render(<App asks={[]} ctl={{}} dref={ref} />);
    el('opener').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => isOpen()).toBe(true);
    await settled();
    const d = drw();
    expect([d.matches(':modal'), d.getAttribute('aria-modal'), d.dataset.component, d.dataset.side]).toEqual([true, 'true', 'drawer', 'right']);
    expect([document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent, document.getElementById(d.getAttribute('aria-describedby')!)!.textContent]).toEqual(['Filters', 'Narrow the list.']);
    expect([d.contains(document.activeElement), ref.current === d]).toEqual([true, true]);
    expect(d.className).toMatch(/extra/);
    expect(box()).toEqual([616, 0, 384, 700]);
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    const r = el('behind').getBoundingClientRect(), hit = document.elementFromPoint(r.left + 2, r.top + 2);
    expect(hit && hit.id).not.toBe('behind');
  });

  test('a backdrop press with a Popover open inside closes only the Popover; the next one asks to close the Drawer', async () => {
    const asks: boolean[] = [];
    await render(<Drawer id="dbp" open onOpenChange={(v) => asks.push(v)} title="Filters"><Popover trigger={<Button id="dbpt">Options</Button>}><p id="dbpc">Pick one</p></Popover></Drawer>);
    const d = el('dbp') as HTMLDialogElement;
    await expect.poll(() => d.open).toBe(true);
    await settled();
    await userEvent.click(el('dbpt'));
    await expect.poll(() => !!el('dbpc') && el('dbpc').getBoundingClientRect().height > 0).toBe(true);
    await userEvent.click(d, { position: { x: 20, y: 20 } });
    await expect.poll(() => !el('dbpc') || el('dbpc').getBoundingClientRect().height === 0).toBe(true);
    expect([d.open, asks.length]).toEqual([true, 0]);
    await userEvent.click(d, { position: { x: 20, y: 20 } });
    await expect.poll(() => asks.join()).toBe('false');
  });

  test('modal={false}: a side panel beside a usable page: not :modal or aria-modal, off the modal stack, the page still clicks and scrolls; Escape inside and the × close it; Escape on the page doesn\'t', async () => {
    const why: string[] = [], clicks: string[] = [];
    function Side() {
      const [open, setOpen] = React.useState(false);
      return <div style={{ height: '2000px' }}>
        <Button id="nmopen" onClick={() => setOpen(true)}>Details</Button>
        <button id="nmpage" onClick={() => clicks.push('page')}>On the page</button>
        <Drawer id="nm" modal={false} open={open} onOpenChange={(v, d) => { why.push(d.reason); setOpen(v); }} title="Details"><Input id="nmin" aria-label="Note" /></Drawer>
      </div>;
    }
    await render(<Side />);
    await userEvent.click(el('nmopen'));
    const d = el('nm') as HTMLDialogElement;
    await expect.poll(() => d.open).toBe(true);
    expect([d.matches(':modal'), d.getAttribute('aria-modal'), topModal() === d, d.contains(document.activeElement)]).toEqual([false, null, false, true]);
    const r = panel('nm').getBoundingClientRect();
    expect([Math.round(r.right), Math.round(r.width)]).toEqual([window.innerWidth, 384]);
    expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
    await userEvent.click(el('nmpage'));
    expect([clicks.join(), d.open, document.activeElement!.id]).toEqual(['page', true, 'nmpage']);
    await userEvent.keyboard('{Escape}');
    expect(d.open).toBe(true);
    el('nmin').focus();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => d.open).toBe(false);
    expect(document.activeElement!.id).toBe('nmopen');
    await userEvent.click(el('nmopen'));
    await expect.poll(() => d.open).toBe(true);
    await userEvent.click(d.querySelector('button[aria-label="Close"]')!);
    await expect.poll(() => d.open).toBe(false);
    expect(why).toEqual(['escape', 'close']);
  });

  test('swipe to close: a touch drag toward the edge past a third closes it (reason "swipe"); a short slow one, a drag across, a mouse drag or swipeToClose={false} leave it open', async () => {
    const why: string[] = [];
    const one = (k: string, p: Partial<DrawerProps> = {}) => <Drawer key={k} id="sw" defaultOpen onOpenChange={(_, d) => why.push(d.reason)} title="Filters" {...p}><p id="swb">Body</p></Drawer>;
    // Events at real times, 100ms apart: a drag's speed comes from their time stamps.
    const swipe = async (dx: number, dy: number, o: { type?: string; from?: Element } = {}) => {
      const p = o.from || panel('sw'), r = p.getBoundingClientRect(), x = r.left + 40, y = r.top + 40;
      const ev = (name: string, cx: number, cy: number) => p.dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, pointerType: o.type || 'touch', clientX: cx, clientY: cy }));
      ev('pointerdown', x, y);
      for (let i = 1; i <= 4; i++) { await new Promise((f) => setTimeout(f, 100)); ev('pointermove', x + dx * i / 4, y + dy * i / 4); }
      ev('pointerup', x + dx, y + dy);
    };
    const d = () => el('sw') as HTMLDialogElement;
    const screen = await render(one('a'));
    await expect.poll(() => d().open).toBe(true);
    await swipe(60, 0);
    await swipe(0, 200);
    await swipe(200, 0, { type: 'mouse' });
    expect([d().open, panel('sw').style.translate, why.join()]).toEqual([true, '', '']);
    await swipe(200, 0);
    await expect.poll(() => d().open).toBe(false);
    await screen.rerender(one('b', { swipeToClose: false }));
    await expect.poll(() => d().open).toBe(true);
    await swipe(300, 0);
    expect(d().open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => d().open).toBe(false);
    // Bottom: dragged by the header (here its title), not the body (which scrolls).
    await screen.rerender(one('c', { side: 'bottom' }));
    await expect.poll(() => d().open).toBe(true);
    await swipe(0, 300, { from: el('swb') });
    expect(d().open).toBe(true);
    await swipe(0, 300, { from: d().querySelector('h2')! });
    await expect.poll(() => d().open).toBe(false);
    expect(why).toEqual(['swipe', 'escape', 'swipe']);
  });

  // A touch drag along x through `path`: [dx from the start, ms after the move before].
  const trace = async (p: HTMLElement, path: [number, number][], up = true) => {
    const r = p.getBoundingClientRect(), x = r.left + 40, y = r.top + 40;
    const ev = (name: string, cx: number) => p.dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerId: 8, isPrimary: true, pointerType: 'touch', clientX: cx, clientY: y }));
    ev('pointerdown', x);
    let at = 0;
    for (const [dx, ms] of path) { await new Promise((f) => setTimeout(f, ms)); ev('pointermove', x + dx); at = dx; }
    if (up) ev('pointerup', x + at);
  };

  test('swipe speed is the last 100ms (EN1): a slow drag that ends in a flick closes it short of a third; a flick back keeps it open past one', async () => {
    const why: string[] = [];
    const one = (k: string) => <Drawer key={k} id="sv" defaultOpen onOpenChange={(_, d) => why.push(d.reason)} title="Filters"><p>Body</p></Drawer>;
    const d = () => el('sv') as HTMLDialogElement;
    const screen = await render(one('a'));
    await expect.poll(() => d().open).toBe(true);
    const third = panel('sv').offsetWidth / 3;
    // Out past a third, then back a little, quickly: it stays.
    await trace(panel('sv'), [[20, 100], [third + 60, 100], [third + 80, 100], [third + 40, 30]]);
    await new Promise((f) => setTimeout(f, 50));
    expect([d().open, why]).toEqual([true, []]);
    // 30px in 300ms, then a flick: closed, though it ends short of a third.
    await screen.rerender(one('b'));
    await trace(panel('sv'), [[12, 100], [20, 100], [30, 100], [third - 10, 40]]);
    await expect.poll(() => d().open).toBe(false);
    expect(why).toEqual(['swipe']);
  });

  test('let go after a swipe (EN1), the panel carries on from under the finger on a translate transition: back when it stays, out past its edge when it closes', async () => {
    await withMotion(async () => {
      const screen = await render(<Drawer key="a" id="sg" defaultOpen title="Filters"><p>Body</p></Drawer>);
      const d = () => el('sg') as HTMLDialogElement;
      await expect.poll(() => d().open).toBe(true);
      await settled();
      const p = panel('sg'), rest = p.getBoundingClientRect().left;
      await trace(p, [[20, 100], [40, 100], [60, 100]]);
      const back = p.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty);
      expect([back, p.getBoundingClientRect().left - rest > 30]).toEqual([['translate'], true]);
      await settled();
      await expect.poll(() => p.hasAttribute('data-settling')).toBe(false);
      expect([d().open, Math.round(p.getBoundingClientRect().left - rest), p.style.translate]).toEqual([true, 0, '']);
      await screen.rerender(<Drawer key="b" id="sg" defaultOpen title="Filters"><p>Body</p></Drawer>);
      await expect.poll(() => d().open).toBe(true);
      await settled();
      const q = panel('sg');
      await trace(q, [[40, 50], [120, 50], [200, 50]]);
      expect([d().open, q.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty)]).toEqual([true, ['translate']]);
      await expect.poll(() => d().open).toBe(false);
      await expect.poll(() => q.style.translate).toBe('');
    });
  });

  test('data-autofocus on a child chooses where focus lands when it opens, not the ×', async () => {
    await render(<Drawer id="daf" open title="Filters"><Input id="dafq" aria-label="Search" data-autofocus /></Drawer>);
    await expect.poll(() => (el('daf') as HTMLDialogElement).open).toBe(true);
    expect(document.activeElement!.id).toBe('dafq');
  });

  test('defaultOpen: open on arrival with no open prop; the ×, Escape and the browser close it by themselves and tell onOpenChange(false) with why', async () => {
    const asks: string[] = [];
    const one = (k: string) => <Drawer key={k} id="drw" defaultOpen onOpenChange={(v, d) => asks.push(v + ' ' + d.reason)} title="Filters"><Input aria-label="Name" /></Drawer>;
    const screen = await render(one('a'));
    await expect.poll(() => isOpen()).toBe(true);
    expect(drw().matches(':modal')).toBe(true);
    await userEvent.click(drw().querySelector('button[aria-label="Close"]')!);
    await expect.poll(() => isOpen()).toBe(false);
    await screen.rerender(one('b'));
    await expect.poll(() => isOpen()).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen()).toBe(false);
    await screen.rerender(one('c'));
    await expect.poll(() => isOpen()).toBe(true);
    drw().close();
    await expect.poll(() => asks.join()).toBe('false close,false escape,false api');
  });

  test('right-to-left page: side="right" still opens on the right, the edge it slides in from', async () => {
    document.documentElement.dir = 'rtl';
    try {
      await render(<Drawer id="drr" open side="right" title="Filters" />);
      await settled();
      const r = panel('drr').getBoundingClientRect();
      expect([Math.round(r.right), Math.round(r.left) > 0]).toEqual([window.innerWidth, true]);
    } finally { document.documentElement.dir = ''; }
  });

  test('right-to-left page: side="left" opens on the left', async () => {
    document.documentElement.dir = 'rtl';
    try {
      await render(<Drawer id="drl2" open side="left" title="Menu" />);
      await settled();
      expect(Math.round(panel('drl2').getBoundingClientRect().left)).toBe(0);
    } finally { document.documentElement.dir = ''; }
  });

  test('a parent that keeps open true: Escape asks each time and it stays open, even when the browser force-closes it on a second Escape', async () => {
    const asks: boolean[] = [];
    function Keep() {
      const [open, setOpen] = React.useState(false);
      return <><Button id="kopen" onClick={() => setOpen(true)}>Open</Button><Drawer id="dkeep" open={open} onOpenChange={(v) => asks.push(v)} title="Filters" /></>;
    }
    await render(<Keep />);
    await userEvent.click(el('kopen'));
    const d = el('dkeep') as HTMLDialogElement;
    await expect.poll(() => d.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => d.open).toBe(true);
    expect(asks.length).toBeGreaterThanOrEqual(3);   // the forced close asks once more
    expect([asks.every((v) => !v), d.matches(':modal'), topModal() === d]).toEqual([true, true, true]);
  });

  test('a Dialog opened from inside it: Escape closes only the Dialog, and the next Escape the Drawer', async () => {
    const asks: string[] = [];
    function Stack() {
      const [d, setD] = React.useState(true), [inner, setInner] = React.useState(false);
      return <Drawer id="drw" open={d} onOpenChange={(v) => { asks.push('drawer:' + v); setD(v); }} title="Filters">
        <Button id="more" onClick={() => setInner(true)}>Save as…</Button>
        <Dialog id="inner" open={inner} onOpenChange={(v) => { asks.push('dialog:' + v); setInner(v); }} title="Name"><Input aria-label="Name" /></Dialog>
      </Drawer>;
    }
    await render(<Stack />);
    await userEvent.click(el('more'));
    await expect.poll(() => (el('inner') as HTMLDialogElement).open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => (el('inner') as HTMLDialogElement).open).toBe(false);
    expect([isOpen(), asks.join()]).toEqual([true, 'dialog:false']);
    await userEvent.keyboard('{Escape}');
    await expect.poll(isOpen).toBe(false);
    expect(asks.join()).toBe('dialog:false,drawer:false');
  });

  test('long content scrolls in the body; the footer is pinned to the bottom, edge to edge, under a 1px line', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await openDrw();
    const bd = el('drw').querySelector('.dk-drawer__body') as HTMLElement, ft = el('drw').querySelector('.dk-drawer__footer') as HTMLElement, f = ft.getBoundingClientRect();
    expect([bd.scrollHeight > bd.clientHeight, getComputedStyle(bd).overflowY]).toEqual([true, 'auto']);
    expect([Math.round(f.bottom), Math.round(f.left), Math.round(f.right), getComputedStyle(ft).borderTopWidth]).toEqual([700, 616, 1000, '1px']);
  });

  test('Tab stays inside the drawer; Escape asks to close, and focus goes back to the button that opened it', async () => {
    const asks: boolean[] = [];
    await render(<App asks={asks} ctl={{}} />);
    el('opener').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => isOpen()).toBe(true);
    for (let i = 0; i < 8; i++) await userEvent.keyboard('{Tab}');
    expect(drw().contains(document.activeElement) || document.activeElement === document.body).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen()).toBe(false);
    expect([asks.join(), document.activeElement!.id]).toEqual(['false', 'opener']);
  });

  test('a click inside the panel doesn\'t close it; nor does a press that starts on the panel and ends on the backdrop; a click on the backdrop asks to close, with reason "outside"', async () => {
    const asks: boolean[] = [], why: string[] = [];
    await render(<App asks={asks} why={why} ctl={{}} />);
    await openDrw();
    const title = titleOf('drw');
    await userEvent.click(title);
    expect(isOpen()).toBe(true);
    // The press goes down on the title and up on the backdrop, which the browser reports as a click on the <dialog>.
    let clicks = 0; const count = () => { clicks++; };
    drw().addEventListener('click', count);
    await userEvent.dragAndDrop(title, drw(), { sourcePosition: { x: 4, y: 4 }, targetPosition: { x: 20, y: 20 } });
    drw().removeEventListener('click', count);
    expect([isOpen(), asks.join(), clicks]).toEqual([true, '', 1]);
    await userEvent.click(drw(), { position: { x: 20, y: 20 } });
    await expect.poll(() => isOpen()).toBe(false);
    expect([asks.join(), why.join()]).toEqual(['false', 'outside']);
  });

  test('the × (a button named "Close") asks to close', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await openDrw();
    const c = el('drw').querySelector('button[aria-label="Close"]') as HTMLElement;
    expect(c.getAttribute('aria-label')).toBe('Close');
    await userEvent.click(c);
    await expect.poll(() => isOpen()).toBe(false);
  });

  test('closed by the browser (dialog.close(), form method="dialog"): asks to close, and opens again next time', async () => {
    const asks: boolean[] = [];
    await render(<App asks={asks} ctl={{}} />);
    await openDrw();
    drw().close();
    await expect.poll(() => asks.join()).toBe('false');
    await openDrw();
    const f = document.createElement('form'); f.method = 'dialog'; f.id = 'fdrw'; f.innerHTML = '<button id="fsub">OK</button>';
    el('drw').querySelector('.dk-drawer__body')!.prepend(f);
    el('fsub').click();
    await expect.poll(() => asks.join()).toBe('false,false');
    f.remove();
    await openDrw();
    expect(isOpen()).toBe(true);
  });

  test('closeOnBackdrop={false}: a backdrop click leaves it open', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    await reopen(ctl, () => ctl.setBd!(false));
    await userEvent.click(drw(), { position: { x: 20, y: 20 } });
    expect(isOpen()).toBe(true);
  });

  test('left, sm: 320px against the left edge; lg: 512px; bottom: full width against the bottom, at most the screen less 64px, rounded only on top; top: against the top, rounded only below', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    await reopen(ctl, () => { ctl.setSide!('left'); ctl.setSize!('sm'); });
    const l = box();
    expect([l[0], l[2], l[3]]).toEqual([0, 320, 700]);
    await reopen(ctl, () => { ctl.setSide!('right'); ctl.setSize!('lg'); });
    const lg = box();
    expect([lg[0], lg[2]]).toEqual([488, 512]);
    await reopen(ctl, () => ctl.setSide!('bottom'));
    let r = panel().getBoundingClientRect(), s = getComputedStyle(panel());
    expect([Math.round(r.left), Math.round(r.width), Math.round(r.top), Math.round(r.bottom), s.borderTopLeftRadius, s.borderBottomLeftRadius]).toEqual([0, 1000, 64, 700, '12px', '0px']);
    await reopen(ctl, () => ctl.setSide!('top'));
    r = panel().getBoundingClientRect(); s = getComputedStyle(panel());
    expect([Math.round(r.top), Math.round(r.bottom), s.borderTopLeftRadius, s.borderBottomLeftRadius]).toEqual([0, 636, '0px', '12px']);
  });

  test('on a screen narrower than the drawer it takes the full width', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    await page.viewport(300, 600);
    await reopen(ctl, () => ctl.setSide!('right'));
    const n = box();
    expect([n[0], n[2]]).toEqual([0, 300]);
  });

  test('look: 24px padding, shadow-xl, 16px between parts, a text-lg semibold title, slides in over 300ms; contrast: title, description and body text 4.5:1 on the panel in all six themes; closed again, the page scrolls', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    await reopen(ctl, () => {});
    const s = getComputedStyle(panel()), ti = getComputedStyle(titleOf('drw'));
    expect([s.paddingTop, s.rowGap, ti.fontSize, ti.fontWeight, withMotion(() => getComputedStyle(panel()).transitionDuration)]).toEqual(['24px', '16px', '18px', '600', '0.3s, 0.3s']);
    expect(s.boxShadow).toMatch(/20px 25px -5px/);
    const still = document.createElement('style'); still.textContent = '* { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = getComputedStyle(panel()).backgroundColor;
      for (const sel of ['.dk-drawer__title', '.dk-drawer__description', '.dk-drawer__body p']) { const r = contrast(getComputedStyle(el('drw').querySelector(sel)!).color, bg); n++; if (r < 4.5) low.push(`${th} ${sel} ${r.toFixed(2)}`); }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light'); still.remove();
    expect(low).toEqual([]);
    expect(n).toBe(18);
    React.act(() => ctl.setOpen!(false));
    await expect.poll(() => getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
  });

  test('--drawer-bg overrides one drawer', async () => {
    await render(<Drawer id="tok" open={false} title="T" style={{ '--drawer-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}>x</Drawer>);
    const d = el('tok') as HTMLDialogElement;
    d.showModal();
    const c = getComputedStyle(panel('tok')).backgroundColor;
    d.close();
    expect(c).toBe('rgb(1, 2, 3)');
  });

  test('StrictMode: a Drawer open on mount stays on the modal stack (A1)', async () => {
    await render(<React.StrictMode><Drawer id="smd" open title="Opened on mount" /></React.StrictMode>);
    await expect.poll(() => (el('smd') as HTMLDialogElement).open).toBe(true);
    expect(topModal()).toBe(el('smd'));
  });
});

describe('Drawer: a body that scrolls', () => {
  test('a long body with nothing focusable takes Tab focus after the ×, as a region named by the title with a focus ring, and Page Down scrolls it; a short one stays out of the Tab order', async () => {
    const text = []; for (let i = 0; i < 80; i++) text.push(<p key={i}>Line {i}</p>);
    const screen = await render(<Drawer id="dsl" open onOpenChange={() => {}} title="Terms">{text}</Drawer>);
    const d = el('dsl') as HTMLDialogElement;
    await expect.poll(() => d.open).toBe(true);
    await settled();
    const body = d.querySelector('.dk-drawer__body') as HTMLElement;
    await expect.poll(() => body.tabIndex).toBe(0);
    expect([body.getAttribute('role'), document.getElementById(body.getAttribute('aria-labelledby')!)!.textContent]).toEqual(['region', 'Terms']);
    (d.querySelector('button[aria-label="Close"]') as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(body);
    expect([getComputedStyle(body).outlineStyle, parseFloat(getComputedStyle(body).outlineWidth) >= 2]).toEqual(['solid', true]);
    await userEvent.keyboard('{PageDown}');
    await expect.poll(() => body.scrollTop).toBeGreaterThan(100);
    await screen.rerender(<Drawer id="dsl" open onOpenChange={() => {}} title="Terms"><p>Short</p></Drawer>);
    await expect.poll(() => body.hasAttribute('tabindex')).toBe(false);
    expect(body.hasAttribute('role')).toBe(false);
  });
  test('your onCancel, onClose, onPointerDown and onClick run too, and the drawer still asks to close', async () => {
    const calls: string[] = [], asks: boolean[] = [];
    const rec = (n: string) => () => { calls.push(n); };
    await render(<Drawer id="dh" open onOpenChange={(v) => { asks.push(v); }} title="Hooks"
      onCancel={rec('cancel')} onClose={rec('close')} onPointerDown={rec('down')} onClick={rec('click')}><p>Body</p></Drawer>);
    const d = el('dh') as HTMLDialogElement;
    await expect.poll(() => d.open).toBe(true);
    await settled();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(d, { position: { x: 20, y: 20 } });
    d.close();
    await expect.poll(() => calls.includes('close')).toBe(true);
    expect([calls.filter((c) => c !== 'close').join(), asks.join()]).toEqual(['cancel,down,click', 'false,false,false']);
  });

  test('aria-labelledby and aria-describedby you pass win; no title, description or ×: no header, and a long body is a region named by aria-label, or with no name just a Tab stop', async () => {
    const text = []; for (let i = 0; i < 80; i++) text.push(<p key={i}>Line {i}</p>);
    const screen = await render(<div><h2 id="ext">Outside name</h2><p id="extd">Outside text</p>
      <Drawer id="dn" open onOpenChange={() => {}} title="Own" description="Own text" aria-labelledby="ext" aria-describedby="extd"><p>Short</p></Drawer></div>);
    const d = () => el('dn') as HTMLDialogElement;
    await expect.poll(() => d().open).toBe(true);
    expect([d().getAttribute('aria-labelledby'), d().getAttribute('aria-describedby')]).toEqual(['ext', 'extd']);
    await screen.rerender(<div><Drawer id="dn" open onOpenChange={() => {}} closeButton={false} aria-label="Terms">{text}</Drawer></div>);
    const body = () => d().querySelector('.dk-drawer__body') as HTMLElement;
    expect(d().querySelector('.dk-drawer__header')).toBe(null);
    await expect.poll(() => body().getAttribute('role')).toBe('region');
    expect([body().getAttribute('aria-label'), body().tabIndex]).toEqual(['Terms', 0]);
    await screen.rerender(<div><Drawer id="dn" open onOpenChange={() => {}} closeButton={false}>{text}</Drawer></div>);
    await expect.poll(() => body().hasAttribute('role')).toBe(false);
    expect([body().tabIndex, body().hasAttribute('aria-label')]).toEqual([0, false]);
  });
});

describe('Drawer: motion (DZ1)', () => {
  const backdropOf = (d: Element) => document.getAnimations().filter((a) => a.effect instanceof KeyframeEffect && a.effect.target === d && a.effect.pseudoElement === '::backdrop');
  const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
  const props = (l: Animation[]) => l.filter((a) => a instanceof CSSTransition).map((a) => [(a).transitionProperty, ms(a)]);
  test('slides in with a transition (backdrop fading with it) and back out to its edge faster, shown until it has gone while focus is back at once and presses go through; reopened mid-way it turns back from where it is', async () => {
    await withMotion(async () => {
      const ctl: Partial<Ctl> = {};
      await render(<App asks={[]} ctl={ctl} />);
      const d = drw(), pn = panel();
      await userEvent.click(el('opener'));
      expect([props(pn.getAnimations()), pn.getAnimations().some((a) => a instanceof CSSAnimation), props(backdropOf(d))]).toEqual([[['translate', 300]], false, [['opacity', 300]]]);
      await settled();
      expect(getComputedStyle(pn).translate).toBe('none');

      React.act(() => ctl.setOpen!(false));
      // Kept in the top layer while it slides out only where overlay can be held (Chromium); elsewhere it closes at once.
      const holds = CSS.supports('overlay', 'auto');
      expect([isOpen(), document.activeElement, getComputedStyle(d).display]).toEqual([false, el('opener'), holds ? 'flex' : 'none']);
      if (!holds) return;
      expect([getComputedStyle(pn).pointerEvents, props(pn.getAnimations()), props(backdropOf(d))]).toEqual(['none', [['translate', 200]], [['opacity', 200]]]);
      await new Promise((ok) => setTimeout(ok, 80));
      const mid = parseFloat(getComputedStyle(pn).translate);
      expect(mid).toBeGreaterThan(5);
      flushSync(() => ctl.setOpen!(true));
      expect(isOpen()).toBe(true);
      expect(Math.abs(parseFloat(getComputedStyle(pn).translate) - mid)).toBeLessThan(40);
      await settled();
      expect(getComputedStyle(pn).translate).toBe('none');
      React.act(() => ctl.setOpen!(false));
      await settled();
      expect(getComputedStyle(d).display).toBe('none');
    });
  });

  test('open on arrival (defaultOpen): there from the first frame, not slid in; a swipe follows the finger with no transition, and let go short it slides back', async () => {
    await withMotion(async () => {
      await render(<Drawer id="drw" defaultOpen title="Filters"><p>Body</p></Drawer>);
      const d = drw(), pn = panel();
      await expect.poll(() => d.open).toBe(true);
      expect([pn.getAnimations().length, backdropOf(d).length, getComputedStyle(pn).translate]).toEqual([0, 0, 'none']);
      const r = pn.getBoundingClientRect(), y = r.top + 40, x0 = r.left + 40;
      const ev = (name: string, cx: number) => pn.dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true, pointerType: 'touch', clientX: cx, clientY: y }));
      // A slow drag, 30px over 150ms, let go well short of a third: it goes back.
      ev('pointerdown', x0); ev('pointermove', x0 + 20);
      await new Promise((ok) => setTimeout(ok, 150));
      ev('pointermove', x0 + 50);
      expect([pn.hasAttribute('data-dragging'), getComputedStyle(pn).translate, pn.getAnimations().length]).toEqual([true, '50px', 0]);
      ev('pointerup', x0 + 50);
      expect([d.open, pn.hasAttribute('data-dragging')]).toEqual([true, false]);
      expect(pn.getAnimations().length).toBeGreaterThan(0);
      await settled();
      expect(getComputedStyle(pn).translate).toBe('none');
    });
  });
});
