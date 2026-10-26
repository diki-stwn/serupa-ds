import * as React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, settle, withMotion } from '../../../tools/test/vitest/helpers';
import { Dialog } from '../Dialog/Dialog';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip, coolTooltips } from './Tooltip';

// Every test starts cold: the warm-up (EC1) would otherwise carry over from the test before.
beforeEach(() => coolTooltips());

const el = (id: string) => document.getElementById(id) as HTMLElement;
// The tooltip an element points at, through aria-describedby or aria-labelledby.
const tipOf = (id: string) => {
  const a = el(id), ids = (a.getAttribute('aria-describedby') || a.getAttribute('aria-labelledby') || '').split(' ');
  return ids.map((i) => document.getElementById(i)).find((x) => x && x.getAttribute('role') === 'tooltip') as HTMLElement;
};
const isOpen = (id: string) => { const t = tipOf(id); return !t.hidden && getComputedStyle(t).display !== 'none'; };
const rect = (e: Element) => e.getBoundingClientRect();
// Distances in CSS px: the test page may be drawn scaled, which leaves layout px a fraction off.
const near = (a: number, b: number) => Math.abs(a - b) <= 1;
const away = () => userEvent.hover(document.body, { position: { x: 500, y: 20 } });

describe('Tooltip', () => {
  test('defaultOpen: shown on arrival, uncontrolled; Escape hides it by itself and tells onOpenChange(false)', async () => {
    const asks: boolean[] = [];
    await render(<Tooltip content="Edit the file" defaultOpen onOpenChange={(v) => asks.push(v)}><button id="tdef">Edit</button></Tooltip>);
    await expect.poll(() => isOpen('tdef')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('tdef')).toBe(false);
    expect(asks.join()).toBe('false');
  });

  test('onOpenChange says why: hover in and out, focus and blur from the keyboard, escape', async () => {
    const why: string[] = [];
    await render(<div style={{ padding: '80px' }}><button id="tbefore">Before</button><Tooltip content="Why" delay={0} onOpenChange={(v, d) => why.push((v ? 'show ' : 'hide ') + d.reason)}><button id="twhy">Why</button></Tooltip></div>);
    await userEvent.hover(el('twhy'));
    await expect.poll(() => isOpen('twhy')).toBe(true);
    await away();
    await expect.poll(() => isOpen('twhy')).toBe(false);
    el('tbefore').focus();
    await userEvent.keyboard('{Tab}');
    await expect.poll(() => isOpen('twhy')).toBe(true);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect.poll(() => isOpen('twhy')).toBe(false);
    await userEvent.keyboard('{Tab}');
    await expect.poll(() => isOpen('twhy')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('twhy')).toBe(false);
    expect(why).toEqual(['show hover', 'hide hover', 'show focus', 'hide blur', 'show focus', 'hide escape']);
  });

  test('wiring: the tooltip (role tooltip) describes its element, keeping an existing aria-describedby; role="label" names it instead', async () => {
    await render(<>
      <Tooltip content="Edit the file"><IconButton id="a" icon="edit" label="Edit" noTitle aria-describedby="other" /></Tooltip>
      <Tooltip content="Settings" role="label"><button id="b"><Icon name="settings" /></button></Tooltip>
    </>);
    const a = el('a'), b = el('b');
    expect(a.getAttribute('aria-describedby')!.split(' ')[0]).toBe('other');
    expect([tipOf('a').getAttribute('role'), tipOf('a').dataset.component]).toEqual(['tooltip', 'tooltip']);
    expect([!!document.getElementById(b.getAttribute('aria-labelledby')!), b.getAttribute('aria-describedby')]).toEqual([true, null]);
    expect(isOpen('a')).toBe(false);
  });

  test('hover: shows after the 400ms delay, above and centered, 6px away, in the top layer; leaving hides it after a short grace', async () => {
    await render(<div style={{ padding: '120px 200px' }}><Tooltip content="Edit the file"><button id="a">Edit</button></Tooltip></div>);
    await userEvent.hover(el('a'));
    await settle(200);
    expect(isOpen('a')).toBe(false);
    await expect.poll(() => isOpen('a')).toBe(true);
    const t = tipOf('a'), a = el('a');
    expect([t.dataset.side, t.matches(':popover-open')]).toEqual(['top', true]);
    expect(near(rect(a).top - rect(t).bottom, 6)).toBe(true);
    expect(near(rect(t).left + rect(t).width / 2, rect(a).left + rect(a).width / 2)).toBe(true);
    await away();
    await settle(50);
    expect(isOpen('a')).toBe(true);
    await expect.poll(() => isOpen('a')).toBe(false);
  });

  test('the pointer can move onto the tooltip without it closing (hoverable); Escape hides it even while hovered (dismissible)', async () => {
    await render(<div style={{ padding: '120px 200px' }}><Tooltip content="Edit the file"><button id="a">Edit</button></Tooltip></div>);
    await userEvent.hover(el('a'));
    await expect.poll(() => isOpen('a')).toBe(true);
    await userEvent.hover(tipOf('a'));
    await settle(300);
    expect(isOpen('a')).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(isOpen('a')).toBe(false);
  });

  test('keyboard focus shows it at once; moving on hides it; bottom puts it 6px below; right-start to the right, tops lined up; a press hides it', async () => {
    await render(<div style={{ padding: '120px 200px', display: 'flex', gap: '24px' }}>
      <Tooltip content="First"><button id="a">A</button></Tooltip>
      <Tooltip content="Below" placement="bottom"><button id="b">B</button></Tooltip>
      <Tooltip content="On the right" placement="right-start"><button id="c">Right</button></Tooltip>
    </div>);
    await userEvent.keyboard('{Tab}');
    expect([document.activeElement!.id, isOpen('a')]).toEqual(['a', true]);
    await userEvent.keyboard('{Tab}');
    const b = tipOf('b');
    expect([isOpen('a'), isOpen('b'), b.dataset.side, near(rect(b).top - rect(el('b')).bottom, 6)]).toEqual([false, true, 'bottom', true]);
    await userEvent.keyboard('{Tab}');
    const c = tipOf('c');
    expect([isOpen('c'), c.dataset.side, near(rect(c).left - rect(el('c')).right, 6), near(rect(c).top, rect(el('c')).top)]).toEqual([true, 'right', true, true]);
    await userEvent.click(el('c'));
    expect(isOpen('c')).toBe(false);
  });

  test('a tap doesn\'t open it later (touch pointerenter, then the compatibility mouseenter), and a press outside hides an open one', async () => {
    await render(<><Tooltip content="Save" delay={50}><button id="t">Save</button></Tooltip><p id="out">Page</p></>);
    const b = el('t'), fire = (type: string, init: PointerEventInit = { pointerType: 'touch' }) => b.dispatchEvent(new PointerEvent(type, { bubbles: type !== 'pointerenter', ...init }));
    fire('pointerenter'); fire('pointerdown'); fire('pointerup');
    b.dispatchEvent(new MouseEvent('mouseenter')); b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await settle(150);
    expect(isOpen('t')).toBe(false);
    await userEvent.hover(b);
    await expect.poll(() => isOpen('t')).toBe(true);
    el('out').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    await expect.poll(() => isOpen('t')).toBe(false);
  });

  test('controlled: hovering only asks (onOpenChange(true)); open decides. disabled: never shows', async () => {
    const opens: boolean[] = [];
    let setOpen: (v: boolean) => void = () => {};
    function Controlled() {
      const [open, set] = React.useState(false); setOpen = set;
      return <Tooltip content="Controlled" open={open} onOpenChange={(v) => { opens.push(v); }}><button id="d">Controlled</button></Tooltip>;
    }
    await render(<><Controlled /><Tooltip content="Never" disabled delay={0}><button id="e">Disabled</button></Tooltip></>);
    await userEvent.hover(el('d'));
    await settle(500);
    expect([isOpen('d'), opens.join()]).toEqual([false, 'true']);
    React.act(() => setOpen(true));
    expect(isOpen('d')).toBe(true);
    await userEvent.hover(el('e'));
    await settle(100);
    expect(isOpen('e')).toBe(false);
  });

  test('no room above: it flips below and stays on screen; an overflow: hidden parent can\'t clip it', async () => {
    await render(<>
      <div style={{ position: 'fixed', top: '0px', left: '300px' }}><Tooltip content="Flipped" delay={0}><button id="g">Top edge</button></Tooltip></div>
      <div style={{ overflow: 'hidden', width: '60px', height: '30px', position: 'relative', margin: '120px 200px' }}><Tooltip content="Not clipped by overflow hidden" delay={0}><button id="h">Clip</button></Tooltip></div>
    </>);
    await userEvent.hover(el('g'));
    await expect.poll(() => { const g = rect(tipOf('g')); return [tipOf('g').dataset.side, isOpen('g') && g.top >= 0 && g.left >= 0 && g.right <= innerWidth && g.bottom <= innerHeight]; }).toEqual(['bottom', true]);
    await userEvent.hover(el('h'));
    await expect.poll(() => { const t = tipOf('h'), r = rect(t); return isOpen('h') && t.contains(document.elementFromPoint(r.left + 4, r.top + r.height / 2)); }).toBe(true);
  });

  test('new text while open places it again, still centered', async () => {
    const tip = (content: string) => <div style={{ padding: '120px 200px' }}><Tooltip content={content} open><button id="n">Name</button></Tooltip></div>;
    const { rerender } = await render(tip('Short'));
    await rerender(tip('A much longer line of text than before'));
    await expect.poll(() => { const t = rect(tipOf('n')), a = rect(el('n')); return t.width > 100 && near(t.left + t.width / 2, a.left + a.width / 2); }).toBe(true);
  });

  test('look: text-xs, 6px corners, 4px 8px padding, 240px at most; --tooltip-bg overrides one', async () => {
    await render(<Tooltip content="Tokens" delay={0} style={{ '--tooltip-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}><button id="f">Tokens</button></Tooltip>);
    await userEvent.hover(el('f'));
    await expect.poll(() => isOpen('f')).toBe(true);
    const s = getComputedStyle(tipOf('f'));
    expect([s.backgroundColor, s.fontSize, s.borderTopLeftRadius, s.padding, s.maxWidth]).toEqual(['rgb(1, 2, 3)', '12px', '6px', '4px 8px', '240px']);
  });

  test('in a Dialog: Escape hides the tooltip and leaves the Dialog open; the next Escape closes the Dialog', async () => {
    function InDialog() {
      const [open, setOpen] = React.useState(false);
      return <><button id="dopen" onClick={() => setOpen(true)}>Open dialog</button>
        <Dialog id="tdlg" open={open} onOpenChange={setOpen} title="In a dialog"><Tooltip content="Inside" delay={0}><button id="i">Inside</button></Tooltip></Dialog></>;
    }
    await render(<InDialog />);
    await userEvent.click(el('dopen'));
    await expect.poll(() => (el('tdlg') as HTMLDialogElement).open).toBe(true);
    await userEvent.hover(el('i'));
    await expect.poll(() => isOpen('i')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('i')).toBe(false);
    expect((el('tdlg') as HTMLDialogElement).open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => (el('tdlg') as HTMLDialogElement).open).toBe(false);
  });

  test('contrast: the text keeps 4.5:1 on the tooltip in all six themes', async () => {
    await render(<Tooltip content="Settings" open><button id="b">B</button></Tooltip>);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const s = getComputedStyle(tipOf('b')), r = contrast(s.color, s.backgroundColor);
      if (r < 4.5) low.push(`${th} ${r.toFixed(2)}`);
    }
    expect(low).toEqual([]);
  });
});

describe('Tooltip warm-up (EC1)', () => {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  function Bar() {
    return <div style={{ display: 'flex', gap: '8px', padding: '80px' }}>
      <Tooltip content="Bold"><button id="wa">B</button></Tooltip>
      <Tooltip content="Italic"><button id="wb">I</button></Tooltip>
      <Tooltip content="Underline"><button id="wc">U</button></Tooltip>
    </div>;
  }

  test('once one has shown, the next opens at once without a fade and the first closes; after 300ms off them all, the delay is back', async () => {
    await render(<Bar />);
    await away(); await wait(400);
    await userEvent.hover(el('wa'));
    await wait(150);
    expect(isOpen('wa')).toBe(false);   // a cold start waits for the delay
    await expect.poll(() => isOpen('wa')).toBe(true);
    expect(tipOf('wa').hasAttribute('data-warm')).toBe(false);
    await userEvent.hover(el('wb'));
    expect([isOpen('wb'), isOpen('wa'), tipOf('wb').hasAttribute('data-warm'), tipOf('wb').getAnimations().length]).toEqual([true, false, true, 0]);
    // Off every tooltip for less than 300ms: still warm.
    await away(); await wait(150);
    await userEvent.hover(el('wc'));
    expect(isOpen('wc')).toBe(true);
    // Off them all for longer: cold again.
    await away(); await wait(500);
    await userEvent.hover(el('wa'));
    await wait(150);
    expect(isOpen('wa')).toBe(false);
    await expect.poll(() => isOpen('wa')).toBe(true);
    await away();
  });
  test('entry: fades in and slides 4px away from its trigger with a transition, not keyframes (EO1)', async () => {
    await withMotion(async () => {
      await render(<div style={{ padding: '80px' }}><Tooltip content="Bold" placement="bottom"><button id="sl">B</button></Tooltip></div>);
      await userEvent.hover(el('sl'));
      await expect.poll(() => isOpen('sl')).toBe(true);
      const t = tipOf('sl');
      const moves = t.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty).sort();
      expect([moves, t.getAnimations().some((a) => a instanceof CSSAnimation), t.dataset.side]).toEqual([['opacity', 'translate'], false, 'bottom']);
      await Promise.all(t.getAnimations().map((a) => a.finished));
      expect([css(t).opacity, css(t).translate]).toEqual(['1', 'none']);
    });
  });
});
