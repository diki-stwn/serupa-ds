import * as React from 'react';
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
const box = () => { const r = panel().getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
// The panel slides in: read positions once every finite animation has ended (headless WebKit can start it late).
const settled = () => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));

type Ctl = { setOpen: (v: boolean) => void; setSide: (s: DrawerProps['side']) => void; setSize: (s: DrawerProps['size']) => void; setBd: (v: boolean) => void };
function App(props: { asks: boolean[]; ctl: Partial<Ctl>; dref?: React.Ref<HTMLDialogElement> }) {
  const [open, setOpen] = React.useState(false), [side, setSide] = React.useState<DrawerProps['side']>('right'), [size, setSize] = React.useState<DrawerProps['size']>('md'), [bd, setBd] = React.useState(true);
  Object.assign(props.ctl, { setOpen, setSide, setSize, setBd });
  const rows = []; for (let i = 0; i < 60; i++) rows.push(<p key={i}>Row {i}</p>);
  return <div style={{ height: '2000px' }}>
    <Button id="opener" onClick={() => setOpen(true)}>Filters</Button>
    <button id="behind">Behind</button>
    <Drawer id="drw" open={open} side={side} size={size} closeOnBackdrop={bd} onOpenChange={(v) => { props.asks.push(v); setOpen(v); }} title="Filters" description="Narrow the list." ref={props.dref} className="extra"
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

  test('data-autofocus on a child chooses where focus lands when it opens, not the ×', async () => {
    await render(<Drawer id="daf" open title="Filters"><Input id="dafq" aria-label="Search" data-autofocus /></Drawer>);
    await expect.poll(() => (el('daf') as HTMLDialogElement).open).toBe(true);
    expect(document.activeElement!.id).toBe('dafq');
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

  test('a click inside the panel doesn\'t close it; nor does a press that starts on the panel and ends on the backdrop; a click on the backdrop asks to close', async () => {
    const asks: boolean[] = [];
    await render(<App asks={asks} ctl={{}} />);
    await openDrw();
    const title = el('drw').querySelector('.dk-drawer__title') as HTMLElement;
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
    expect(asks.join()).toBe('false');
  });

  test('the × (a button named "Close") asks to close', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await openDrw();
    const c = el('drw').querySelector('.dk-drawer__close') as HTMLElement;
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
    const s = getComputedStyle(panel()), ti = getComputedStyle(el('drw').querySelector('.dk-drawer__title')!);
    expect([s.paddingTop, s.rowGap, ti.fontSize, ti.fontWeight, withMotion(() => getComputedStyle(panel()).animationDuration)]).toEqual(['24px', '16px', '18px', '600', '0.3s']);
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
