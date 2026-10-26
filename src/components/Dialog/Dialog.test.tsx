import * as React from 'react';
import { flushSync } from 'react-dom';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, withMotion } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { topModal } from '../../internal/layers';
import { Popover } from '../Popover/Popover';
import { Dialog } from './Dialog';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const dlg = (id: string) => el(id) as HTMLDialogElement;
const panel = (id: string) => el(id).querySelector('.dk-dialog__panel') as HTMLElement;
const isOpen = (id: string) => dlg(id).open;
// The title is the element that names the dialog (aria-labelledby).
const titleOf = (id: string) => document.getElementById(el(id).getAttribute('aria-labelledby')!) as HTMLElement;
// The panel scales in from 95%: measure once every finite animation has ended (headless WebKit can start it late).
const settled = () => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));

type Ctl = { setOpen: (v: boolean) => void; setAlert: (v: boolean) => void; setSize: (s: 'sm' | 'md' | 'lg') => void };
function App(props: { asks: string[]; ctl: Partial<Ctl>; dref?: React.Ref<HTMLDialogElement>; why?: string[] }) {
  const [open, setOpen] = React.useState(false), [al, setAlert] = React.useState(false), [size, setSize] = React.useState<'sm' | 'md' | 'lg'>('md');
  Object.assign(props.ctl, { setOpen, setAlert, setSize });
  const ask = (k: string, set: (v: boolean) => void) => (v: boolean, d?: { reason: string }) => { props.asks.push(k + ':' + v); if (props.why && d) props.why.push(d.reason); set(v); };
  return <div style={{ height: '2000px' }}>
    <Button id="opener" onClick={() => setOpen(true)}>Open</Button>
    <Button id="aopener" onClick={() => setAlert(true)}>Delete</Button>
    <button id="behind">Behind</button>
    <Dialog id="dlg" open={open} onOpenChange={ask('dlg', setOpen)} size={size} title="Invite people" description="They’ll get an email." ref={props.dref} className="extra"
      footer={[<Button key={1} variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>, <Button key={2} id="send">Send</Button>]}>
      <Input id="email" aria-label="Email" />
    </Dialog>
    <Dialog id="alert" alert open={al} onOpenChange={ask('alert', setAlert)} title="Delete Atlas?" description="This can’t be undone." size="sm"
      footer={[<Button key={1} id="keep" variant="secondary" onClick={() => setAlert(false)}>Keep</Button>, <Button key={2} destructive>Delete</Button>]} />
  </div>;
}
const openDlg = async () => { await userEvent.click(el('opener')); await expect.poll(() => isOpen('dlg')).toBe(true); await settled(); };

describe('Dialog', () => {
  beforeEach(async () => { await page.viewport(1000, 700); });
  afterAll(async () => { await page.viewport(900, 700); });

  test('closed at first: not shown', async () => {
    await render(<App asks={[]} ctl={{}} />);
    expect([isOpen('dlg'), getComputedStyle(el('dlg')).display]).toEqual([false, 'none']);
  });

  test('open: a modal <dialog> (top layer), named by the title and described by the description, focus inside; ref and className reach it; md: 512px wide, centered on the screen; the page behind doesn\'t scroll and can\'t be clicked', async () => {
    const ref = React.createRef<HTMLDialogElement>();
    await render(<App asks={[]} ctl={{}} dref={ref} />);
    el('opener').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => isOpen('dlg')).toBe(true);
    await settled();
    const d = dlg('dlg'), pn = panel('dlg').getBoundingClientRect();
    expect([d.matches(':modal'), d.tagName, d.getAttribute('aria-modal'), d.getAttribute('role'), d.dataset.component]).toEqual([true, 'DIALOG', 'true', null, 'dialog']);
    expect([document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent, document.getElementById(d.getAttribute('aria-describedby')!)!.textContent]).toEqual(['Invite people', 'They’ll get an email.']);
    expect([d.contains(document.activeElement), ref.current === d]).toEqual([true, true]);
    expect(d.className).toMatch(/extra/);
    expect([Math.round(pn.width), Math.round(pn.left + pn.width / 2)]).toEqual([512, 500]);
    expect(Math.abs(Math.round(pn.top + pn.height / 2) - 350)).toBeLessThanOrEqual(1);
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    const r = el('behind').getBoundingClientRect(), hit = document.elementFromPoint(r.left + 2, r.top + 2);
    expect(hit && hit.id).not.toBe('behind');
  });

  test('Tab stays inside the dialog; Escape asks to close (onOpenChange(false)), and focus goes back to the button that opened it', async () => {
    const asks: string[] = [];
    await render(<App asks={asks} ctl={{}} />);
    el('opener').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => isOpen('dlg')).toBe(true);
    for (let i = 0; i < 8; i++) await userEvent.keyboard('{Tab}');
    expect(el('dlg').contains(document.activeElement) || document.activeElement === document.body).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('dlg')).toBe(false);
    expect([asks.join(), document.activeElement!.id]).toEqual(['dlg:false', 'opener']);
  });

  test('a click inside the panel doesn\'t close it; nor does a press that starts on the panel and ends on the backdrop (selecting text); a click on the backdrop asks to close, with reason "outside"', async () => {
    const asks: string[] = [], why: string[] = [];
    await render(<App asks={asks} why={why} ctl={{}} />);
    await openDlg();
    await userEvent.click(panel('dlg'), { position: { x: 30, y: 120 } });
    expect(isOpen('dlg')).toBe(true);
    // The press goes down on the panel and up on the backdrop, which the browser reports as a click on the <dialog>.
    let clicks = 0; const count = () => { clicks++; };
    el('dlg').addEventListener('click', count);
    await userEvent.dragAndDrop(panel('dlg'), el('dlg'), { sourcePosition: { x: 30, y: 120 }, targetPosition: { x: 20, y: 20 } });
    el('dlg').removeEventListener('click', count);
    expect([isOpen('dlg'), asks.join(), clicks]).toEqual([true, '', 1]);
    await userEvent.click(el('dlg'), { position: { x: 20, y: 20 } });
    await expect.poll(() => isOpen('dlg')).toBe(false);
    expect([asks.join(), why.join()]).toEqual(['dlg:false', 'outside']);
  });

  test('a backdrop press with a Popover open inside closes only the Popover; the next one asks to close the Dialog', async () => {
    const asks: boolean[] = [];
    await render(<Dialog id="bp" open onOpenChange={(v) => asks.push(v)} title="Share"><Popover trigger={<Button id="bpt">Options</Button>}><p id="bpc">Pick one</p></Popover></Dialog>);
    await expect.poll(() => isOpen('bp')).toBe(true);
    await userEvent.click(el('bpt'));
    await expect.poll(() => !!el('bpc') && el('bpc').getBoundingClientRect().height > 0).toBe(true);
    await userEvent.click(el('bp'), { position: { x: 20, y: 20 } });
    await expect.poll(() => !el('bpc') || el('bpc').getBoundingClientRect().height === 0).toBe(true);
    expect([isOpen('bp'), asks.length]).toEqual([true, 0]);
    await userEvent.click(el('bp'), { position: { x: 20, y: 20 } });
    await expect.poll(() => asks.join()).toBe('false');
  });

  test('the × (a button named "Close") asks to close', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await openDlg();
    const c = el('dlg').querySelector('button[aria-label="Close"]') as HTMLElement;
    expect([c.getAttribute('aria-label'), c.tagName]).toEqual(['Close', 'BUTTON']);
    await userEvent.click(c);
    await expect.poll(() => isOpen('dlg')).toBe(false);
  });

  test('keyboard table: Enter or Space on the × closes it, the same as Escape (FH1)', async () => {
    await render(<App asks={[]} ctl={{}} />);
    const closedBy: string[] = [];
    for (const k of ['{Enter}', '[Space]']) {
      await openDlg();
      (el('dlg').querySelector('button[aria-label="Close"]') as HTMLElement).focus();
      await userEvent.keyboard(k);
      await expect.poll(() => isOpen('dlg')).toBe(false);
      closedBy.push(document.activeElement!.id);
    }
    expect(closedBy).toEqual(['opener', 'opener']);
  });

  test('closed by the browser (dialog.close(), form method="dialog"): asks to close, and opens again next time', async () => {
    const asks: string[] = [];
    await render(<App asks={asks} ctl={{}} />);
    await openDlg();
    dlg('dlg').close();
    await expect.poll(() => asks.join()).toBe('dlg:false');
    await openDlg();
    const f = document.createElement('form'); f.method = 'dialog'; f.id = 'fdlg'; f.innerHTML = '<button id="fsub">OK</button>';
    el('dlg').querySelector('.dk-dialog__body')!.appendChild(f);
    el('fsub').click();
    await expect.poll(() => asks.join()).toBe('dlg:false,dlg:false');
    f.remove();
    await openDlg();
    expect(isOpen('dlg')).toBe(true);
  });

  test('defaultOpen: open on arrival with no open prop; the ×, Escape and the browser close it by themselves, tell onOpenChange(false) with why, and it stays closed', async () => {
    const asks: string[] = [];
    const one = (k: string) => <Dialog key={k} id="dd" defaultOpen onOpenChange={(v, d) => asks.push(v + ' ' + d.reason)} title="Welcome"><Input aria-label="Name" /></Dialog>;
    const screen = await render(one('a'));
    await expect.poll(() => isOpen('dd')).toBe(true);
    expect(dlg('dd').matches(':modal')).toBe(true);
    await userEvent.click(el('dd').querySelector('button[aria-label="Close"]')!);
    await expect.poll(() => isOpen('dd')).toBe(false);
    await screen.rerender(one('b'));
    await expect.poll(() => isOpen('dd')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('dd')).toBe(false);
    await screen.rerender(one('c'));
    await expect.poll(() => isOpen('dd')).toBe(true);
    dlg('dd').close();
    await expect.poll(() => asks.join()).toBe('false close,false escape,false api');
    await expect.poll(() => [isOpen('dd'), getComputedStyle(el('dd')).display]).toEqual([false, 'none']);
  });

  test('lg: 672px; on a small screen it keeps 16px from each edge and fits the height', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    React.act(() => { ctl.setSize!('lg'); ctl.setOpen!(true); });
    await expect.poll(() => isOpen('dlg')).toBe(true);
    await settled();
    expect(Math.round(panel('dlg').getBoundingClientRect().width)).toBe(672);
    React.act(() => ctl.setOpen!(false));
    await page.viewport(360, 300);
    React.act(() => { ctl.setSize!('md'); ctl.setOpen!(true); });
    await expect.poll(() => isOpen('dlg')).toBe(true);
    await settled();
    const r = panel('dlg').getBoundingClientRect();
    expect([Math.round(r.left), Math.round(r.width)]).toEqual([16, 328]);
    expect(Math.round(r.top)).toBeGreaterThanOrEqual(16);
    expect(Math.round(r.bottom)).toBeLessThanOrEqual(284);
    React.act(() => ctl.setOpen!(false));
  });

  test('data-autofocus on a child chooses where focus lands when it opens, not the ×', async () => {
    function Pick() {
      const [open, setOpen] = React.useState(false);
      return <><Button id="afopen" onClick={() => setOpen(true)}>Open</Button>
        <Dialog id="af" open={open} onOpenChange={setOpen} title="Rename"><Input id="afname" aria-label="Name" data-autofocus /></Dialog></>;
    }
    await render(<Pick />);
    await userEvent.click(el('afopen'));
    await expect.poll(() => isOpen('af')).toBe(true);
    expect(document.activeElement!.id).toBe('afname');
  });

  function Confirm({ inside }: { inside: boolean }) {
    const [open, setOpen] = React.useState(false);
    const cancel = React.useRef<HTMLButtonElement>(null), outside = React.useRef<HTMLButtonElement>(null);
    return <><Button id="ifopen" ref={outside} onClick={() => setOpen(true)}>Delete</Button>
      <Dialog id="if" open={open} onOpenChange={setOpen} title="Delete the file?" initialFocus={inside ? cancel : outside}
        footer={<><Button id="ifcancel" ref={cancel} variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button id="ifdelete" destructive data-autofocus>Delete</Button></>} /></>;
  }

  test('initialFocus picks where focus lands when it opens, over data-autofocus', async () => {
    await render(<Confirm inside />);
    await userEvent.click(el('ifopen'));
    await expect.poll(() => isOpen('if')).toBe(true);
    expect(document.activeElement!.id).toBe('ifcancel');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('if')).toBe(false);
  });

  test('initialFocus pointing outside the dialog is ignored, so focus stays in the modal', async () => {
    await render(<Confirm inside={false} />);
    await userEvent.click(el('ifopen'));
    await expect.poll(() => isOpen('if')).toBe(true);
    expect(document.activeElement!.id).toBe('ifdelete');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('if')).toBe(false);
  });

  test('a parent that keeps open true: Escape asks each time and it stays open, even when the browser force-closes it on a second Escape', async () => {
    const asks: boolean[] = [];
    function Keep() {
      const [open, setOpen] = React.useState(false);
      return <><Button id="kopen" onClick={() => setOpen(true)}>Open</Button><Dialog id="keep" open={open} onOpenChange={(v) => asks.push(v)} title="Unsaved changes" /></>;
    }
    await render(<Keep />);
    await userEvent.click(el('kopen'));
    await expect.poll(() => isOpen('keep')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('keep')).toBe(true);
    expect(asks.length).toBeGreaterThanOrEqual(3);   // the forced close asks once more
    expect([asks.every((v) => !v), dlg('keep').matches(':modal'), topModal() === dlg('keep')]).toEqual([true, true, true]);
  });

  test('alert: role="alertdialog", 384px (sm), no ×, the backdrop doesn\'t close it, Escape does', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await userEvent.click(el('aopener'));
    await expect.poll(() => isOpen('alert')).toBe(true);
    await settled();
    const d = el('alert');
    expect([d.getAttribute('role'), !!d.querySelector('button[aria-label="Close"]'), Math.round(panel('alert').getBoundingClientRect().width)]).toEqual(['alertdialog', false, 384]);
    await userEvent.click(d, { position: { x: 20, y: 20 } });
    expect(isOpen('alert')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('alert')).toBe(false);
  });

  test('stacked: a Dialog opened from inside another takes focus, and Escape, the × and its backdrop close only it; the next Escape closes the outer one', async () => {
    const asks: string[] = [];
    function Stack() {
      const [outer, setOuter] = React.useState(true), [inner, setInner] = React.useState(false);
      const ask = (k: string, set: (v: boolean) => void) => (v: boolean) => { asks.push(k + ':' + v); set(v); };
      return <Dialog id="outer" open={outer} onOpenChange={ask('outer', setOuter)} title="Settings">
        <Button id="more" onClick={() => setInner(true)}>More</Button>
        <Dialog id="inner" open={inner} onOpenChange={ask('inner', setInner)} title="Advanced"><Input id="deep" aria-label="Deep" /></Dialog>
      </Dialog>;
    }
    await render(<Stack />);
    await expect.poll(() => isOpen('outer')).toBe(true);
    for (const how of ['escape', 'close', 'backdrop'] as const) {
      await userEvent.click(el('more'));
      await expect.poll(() => isOpen('inner')).toBe(true);
      await settled();
      expect(dlg('inner').contains(document.activeElement)).toBe(true);
      if (how === 'escape') await userEvent.keyboard('{Escape}');
      else if (how === 'close') await userEvent.click(el('inner').querySelector('button[aria-label="Close"]')!);
      else await userEvent.click(el('inner'), { position: { x: 5, y: 5 } });
      await expect.poll(() => isOpen('inner')).toBe(false);
      expect([how, isOpen('outer'), asks.join()]).toEqual([how, true, 'inner:false']);
      expect(document.activeElement).toBe(el('more'));
      asks.length = 0;
    }
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('outer')).toBe(false);
    expect(asks.join()).toBe('outer:false');
  });

  test('look: 24px padding, 12px corners, shadow-xl, 16px between parts, a text-lg semibold title, actions at the end; contrast: title and description 4.5:1 on the panel in all six themes; closed again, the page scrolls', async () => {
    const ctl: Partial<Ctl> = {};
    await render(<App asks={[]} ctl={ctl} />);
    React.act(() => ctl.setOpen!(true));
    await expect.poll(() => isOpen('dlg')).toBe(true);
    await settled();
    const s = getComputedStyle(panel('dlg')), ti = getComputedStyle(titleOf('dlg'));
    expect([s.paddingTop, s.borderTopLeftRadius, s.rowGap, ti.fontSize, ti.fontWeight, getComputedStyle(el('dlg').querySelector('.dk-dialog__footer')!).justifyContent]).toEqual(['24px', '12px', '16px', '18px', '600', 'flex-end']);
    expect(s.boxShadow).toMatch(/20px 25px -5px/);
    const still = document.createElement('style'); still.textContent = '* { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = getComputedStyle(panel('dlg')).backgroundColor;
      for (const sel of ['.dk-dialog__title', '.dk-dialog__description']) { const r = contrast(getComputedStyle(el('dlg').querySelector(sel)!).color, bg); n++; if (r < 4.5) low.push(`${th} ${sel} ${r.toFixed(2)}`); }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light'); still.remove();
    expect(low).toEqual([]);
    expect(n).toBe(12);
    React.act(() => ctl.setOpen!(false));
    await expect.poll(() => getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
  });

  test('--dialog-bg overrides one dialog', async () => {
    await render(<Dialog id="tok" open={false} title="T" style={{ '--dialog-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}>x</Dialog>);
    const d = dlg('tok');
    d.showModal();
    const c = getComputedStyle(panel('tok')).backgroundColor;
    d.close();
    expect(c).toBe('rgb(1, 2, 3)');
  });

  test('fullScreen: true fills the screen with square corners and the footer at the bottom; "mobile" only under 640px (idea 53)', async () => {
    await render(<>
      <Dialog id="fs" open fullScreen title="Edit profile" footer={<Button>Save</Button>}><p>Body</p></Dialog>
    </>);
    await settled();
    const r = panel('fs').getBoundingClientRect(), s = getComputedStyle(panel('fs'));
    expect([Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), s.borderTopLeftRadius]).toEqual([0, 0, 1000, 700, '0px']);
    const foot = panel('fs').querySelector('.dk-dialog__footer')!.getBoundingClientRect();
    expect(Math.round(foot.bottom)).toBe(700 - 24);
  });

  test('fullScreen="mobile": a centered panel on a wide screen, the whole screen on a phone', async () => {
    await render(<Dialog id="fm" open fullScreen="mobile" title="Filters"><p>Body</p></Dialog>);
    await settled();
    expect(Math.round(panel('fm').getBoundingClientRect().width)).toBe(512);
    await page.viewport(390, 700);
    await expect.poll(() => { const r = panel('fm').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }).toEqual([390, 700]);
  });

  test('StrictMode: a Dialog open on mount stays on the modal stack, so toasts and announcements move into it (A1)', async () => {
    await render(<React.StrictMode><Dialog id="sm" open title="Opened on mount" /></React.StrictMode>);
    await expect.poll(() => isOpen('sm')).toBe(true);
    expect(topModal()).toBe(dlg('sm'));
  });
});

describe('Dialog: a body that scrolls', () => {
  test('a long body with nothing focusable takes Tab focus after the ×, as a region named by the title with a focus ring, and Page Down scrolls it; aria-label names it without a title; a short one stays out of the Tab order', async () => {
    const text = []; for (let i = 0; i < 80; i++) text.push(<p key={i}>Line {i}</p>);
    const screen = await render(<Dialog id="dsl" open onOpenChange={() => {}} title="Terms">{text}</Dialog>);
    const d = dlg('dsl');
    await expect.poll(() => d.open).toBe(true);
    await settled();
    const body = d.querySelector('.dk-dialog__body') as HTMLElement;
    await expect.poll(() => body.tabIndex).toBe(0);
    expect([body.getAttribute('role'), document.getElementById(body.getAttribute('aria-labelledby')!)!.textContent]).toEqual(['region', 'Terms']);
    (d.querySelector('button[aria-label="Close"]') as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(body);
    expect([getComputedStyle(body).outlineStyle, parseFloat(getComputedStyle(body).outlineWidth) >= 2]).toEqual(['solid', true]);
    await userEvent.keyboard('{PageDown}');
    await expect.poll(() => body.scrollTop).toBeGreaterThan(100);
    await screen.rerender(<Dialog id="dsl" open onOpenChange={() => {}} aria-label="Terms of use">{text}</Dialog>);
    await expect.poll(() => body.getAttribute('aria-label')).toBe('Terms of use');
    expect([body.getAttribute('role'), body.hasAttribute('aria-labelledby')]).toEqual(['region', false]);
    await screen.rerender(<Dialog id="dsl" open onOpenChange={() => {}} title="Terms"><p>Short</p></Dialog>);
    await expect.poll(() => body.hasAttribute('tabindex')).toBe(false);
    expect(body.hasAttribute('role')).toBe(false);
  });
});

describe('Dialog: motion (DZ1)', () => {
  // WebKit reports a ::backdrop transition with no pseudoElement, on the dialog itself; the dialog has no opacity transition of its own.
  const backdropOf = (d: Element) => document.getAnimations().filter((a) => a.effect instanceof KeyframeEffect && a.effect.target === d && (a.effect.pseudoElement === '::backdrop' || (!a.effect.pseudoElement && a instanceof CSSTransition && a.transitionProperty === 'opacity')));
  const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
  test('opens with transitions (the backdrop fading in, the panel fading and scaling in 50ms after it) and closes faster, shown until the fade ends while focus is back at once and presses go through; reopened mid-way it turns back from where it is', async () => {
    await withMotion(async () => {
      const ctl: Partial<Ctl> = {};
      await render(<App asks={[]} ctl={ctl} />);
      const d = dlg('dlg'), pn = panel('dlg');
      await userEvent.click(el('opener'));
      const enter = pn.getAnimations();
      expect([enter.filter((a) => a instanceof CSSTransition).map((a) => (a).transitionProperty).sort(), enter.some((a) => a instanceof CSSAnimation), enter.map(ms)]).toEqual([['opacity', 'scale'], false, [200, 200]]);
      expect(backdropOf(d).map((a) => [(a as CSSTransition).transitionProperty, ms(a)])).toEqual([['opacity', 200]]);
      // A sequence: the backdrop starts at once, the panel motion-sequence (50ms) later.
      const delay = (a: Animation) => Number(a.effect!.getTiming().delay);
      expect([enter.map(delay), backdropOf(d).map(delay)]).toEqual([[50, 50], [0]]);
      await settled();
      expect([getComputedStyle(pn).opacity, getComputedStyle(pn).scale]).toEqual(['1', 'none']);

      await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
      // Kept in the top layer while it fades only where overlay can be held (Chromium); elsewhere it closes at once.
      const holds = CSS.supports('overlay', 'auto');
      expect([isOpen('dlg'), document.activeElement, getComputedStyle(d).display]).toEqual([false, el('opener'), holds ? 'flex' : 'none']);
      if (!holds) return;
      expect([getComputedStyle(d).pointerEvents, pn.getAnimations().map(ms), backdropOf(d).map(ms)]).toEqual(['none', [150, 150], [150]]);
      await new Promise((ok) => setTimeout(ok, 60));
      const mid = Number(getComputedStyle(pn).opacity);
      expect(mid).toBeGreaterThan(0.05);
      flushSync(() => ctl.setOpen!(true));
      expect(isOpen('dlg')).toBe(true);
      expect(Math.abs(Number(getComputedStyle(pn).opacity) - mid)).toBeLessThan(0.3);
      await settled();
      expect(getComputedStyle(pn).opacity).toBe('1');

      await userEvent.keyboard('{Escape}');
      await settled();
      expect([isOpen('dlg'), getComputedStyle(d).display]).toEqual([false, 'none']);
    });
  });

  test('open on arrival (defaultOpen): there from the first frame, not faded in; closing it, and opening it again, move as usual', async () => {
    await withMotion(async () => {
      const screen = await render(<Dialog id="arr" defaultOpen title="Welcome" />);
      const d = dlg('arr'), pn = panel('arr');
      await expect.poll(() => d.open).toBe(true);
      expect([pn.getAnimations().length, backdropOf(d).length, getComputedStyle(pn).opacity]).toEqual([0, 0, '1']);
      await screen.rerender(<Dialog id="arr" open={false} title="Welcome" />);
      expect([d.open, d.hasAttribute('data-instant')]).toEqual([false, false]);
      if (CSS.supports('overlay', 'auto')) expect(pn.getAnimations().length).toBe(2);
      await settled();
      await screen.rerender(<Dialog id="arr" open title="Welcome" onOpenChange={() => {}} />);
      expect(pn.getAnimations().map(ms)).toEqual([200, 200]);
    });
  });

  test('closing, the panel shrinks where it stands: its centre stays put every frame of the fade, not jumping to the corner (FM1)', async () => {
    if (!CSS.supports('overlay', 'auto')) return;
    await withMotion(async () => {
      const ctl: Partial<Ctl> = {};
      await render(<App asks={[]} ctl={ctl} />);
      await openDlg();
      const pn = panel('dlg'), centre = (r: DOMRect) => [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
      const at = centre(pn.getBoundingClientRect());
      flushSync(() => ctl.setOpen!(false));
      const seen: number[][] = [];
      while (pn.getAnimations().length) { seen.push(centre(pn.getBoundingClientRect())); await new Promise(requestAnimationFrame); }
      expect(seen.length).toBeGreaterThan(1);
      expect(seen.filter(([x, y]) => Math.abs(x - at[0]) > 1 || Math.abs(y - at[1]) > 1)).toEqual([]);
    });
  });
});
