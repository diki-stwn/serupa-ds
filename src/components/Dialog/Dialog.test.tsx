import * as React from 'react';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { topModal } from '../../internal/layers';
import { Dialog } from './Dialog';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const dlg = (id: string) => el(id) as HTMLDialogElement;
const panel = (id: string) => el(id).querySelector('.dk-dialog__panel') as HTMLElement;
const isOpen = (id: string) => dlg(id).open;
// The panel scales in from 95%: measure once every finite animation has ended (headless WebKit can start it late).
const settled = () => Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));

type Ctl = { setOpen: (v: boolean) => void; setAlert: (v: boolean) => void; setSize: (s: 'sm' | 'md' | 'lg') => void };
function App(props: { asks: string[]; ctl: Partial<Ctl>; dref?: React.Ref<HTMLDialogElement> }) {
  const [open, setOpen] = React.useState(false), [al, setAlert] = React.useState(false), [size, setSize] = React.useState<'sm' | 'md' | 'lg'>('md');
  Object.assign(props.ctl, { setOpen, setAlert, setSize });
  const ask = (k: string, set: (v: boolean) => void) => (v: boolean) => { props.asks.push(k + ':' + v); set(v); };
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

  test('a click inside the panel doesn\'t close it; nor does a press that starts on the panel and ends on the backdrop (selecting text); a click on the backdrop asks to close', async () => {
    const asks: string[] = [];
    await render(<App asks={asks} ctl={{}} />);
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
    expect(asks.join()).toBe('dlg:false');
  });

  test('the × (a button named "Close") asks to close', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await openDlg();
    const c = el('dlg').querySelector('.dk-dialog__close') as HTMLElement;
    expect([c.getAttribute('aria-label'), c.tagName]).toEqual(['Close', 'BUTTON']);
    await userEvent.click(c);
    await expect.poll(() => isOpen('dlg')).toBe(false);
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

  test('alert: role="alertdialog", 384px (sm), no ×, the backdrop doesn\'t close it, Escape does', async () => {
    await render(<App asks={[]} ctl={{}} />);
    await userEvent.click(el('aopener'));
    await expect.poll(() => isOpen('alert')).toBe(true);
    await settled();
    const d = el('alert');
    expect([d.getAttribute('role'), !!d.querySelector('.dk-dialog__close'), Math.round(panel('alert').getBoundingClientRect().width)]).toEqual(['alertdialog', false, 384]);
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
      else if (how === 'close') await userEvent.click(el('inner').querySelector('.dk-dialog__close')!);
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
    const s = getComputedStyle(panel('dlg')), ti = getComputedStyle(el('dlg').querySelector('.dk-dialog__title')!);
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
