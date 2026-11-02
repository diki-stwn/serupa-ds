import * as React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css, settle, withMotion } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import { Drawer } from '../Drawer/Drawer';
import { toast, Toaster, type ToasterPosition } from './Toast';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const toasts = () => [...document.querySelectorAll<HTMLElement>('[data-toast]')];
// Each toast is named by its title (aria-labelledby).
const titles = () => toasts().map((x) => document.getElementById(x.getAttribute('aria-labelledby')!)!.textContent);
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const el = (id: string) => document.getElementById(id) as HTMLElement;
const away = () => userEvent.hover(document.body, { position: { x: 5, y: 5 } });
// Toasts slide in for 200ms: measure once that has finished.
const landed = () => Promise.all(document.getAnimations().map((a) => a.finished));

let setPos: (p: ToasterPosition) => void = () => {};
function App() {
  const [pos, set] = React.useState<ToasterPosition>('bottom-end'); setPos = set;
  return <Toaster position={pos} className="extra" />;
}
beforeEach(() => { React.act(() => toast.dismiss()); });

// A toast's action button: its first button, the one named by its text (× is named by aria-label).
const undoButton = (t: Element) => t.querySelector('button:not([aria-label])') as HTMLButtonElement;
describe('Toast', () => {
  test('the Toaster is a <section> named "Notifications" holding a list, and the shared live region exists', async () => {
    await render(<App />);
    const s = q('.dk-toaster');
    expect([s.tagName, s.getAttribute('aria-label'), s.firstElementChild!.tagName, !!document.querySelector('[data-dk-announcer]')]).toEqual(['SECTION', 'Notifications', 'OL', true]);
    expect(s.className).toMatch(/extra/);
  });

  test('two Toasters: only the newest shows each toast, with a warning once; when it unmounts, the older one takes the toasts over (AO2)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      function Two({ both }: { both: boolean }) {
        return <><Toaster id="t-old" />{both ? <Toaster id="t-new" /> : null}</>;
      }
      const r = await render(<Two both />);
      React.act(() => { toast({ title: 'Link copied', duration: 0 }); });
      const shown = (id: string) => el(id).querySelectorAll('li').length;
      await expect.poll(() => [shown('t-old'), shown('t-new')]).toEqual([0, 1]);
      expect(warn.mock.calls.filter((c) => String(c[0]).startsWith('Toaster:')).length).toBe(1);
      await r.rerender(<Two both={false} />);
      await expect.poll(() => shown('t-old')).toBe(1);
    } finally { warn.mockRestore(); }
  });

  test('toast() shows it at the bottom end, 16px in, 384px wide: labelled by its title, described by its description, a tone icon, a Dismiss button; announced politely', async () => {
    await render(<App />);
    let id = '';
    React.act(() => { id = toast({ title: 'Changes saved', description: 'All files are up to date.', tone: 'success', duration: 0 }); });
    await expect.poll(() => document.querySelector('[data-dk-announcer]')!.textContent).toBe('Changes saved. All files are up to date.');
    await landed();
    const x = toasts()[0], r = x.getBoundingClientRect();
    expect(typeof id).toBe('string');
    expect([document.getElementById(x.getAttribute('aria-labelledby')!)!.textContent, document.getElementById(x.getAttribute('aria-describedby')!)!.textContent]).toEqual(['Changes saved', 'All files are up to date.']);
    expect([x.querySelector<HTMLElement>(':scope > span[aria-hidden] > [data-icon]')?.dataset.icon, x.querySelector('button[aria-label="Dismiss"]')!.getAttribute('aria-label')]).toEqual(['check_circle', 'Dismiss']);
    expect([r.width, Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom)]).toEqual([384, 16, 16]);
  });

  // 191: a long word breaks where its language hyphenates it, before overflow-wrap cuts it anywhere.
  test('the title and description hyphenate in the language around them, and a long word still never overflows (191)', async () => {
    await render(<div lang="de"><App /></div>);
    React.act(() => { toast({ title: 'Donaudampfschifffahrtsgesellschaftskapitän', description: 'Rechtsschutzversicherungsgesellschaften', duration: 0 }); });
    await landed();
    const x = toasts()[0], title = el(x.getAttribute('aria-labelledby')!), desc = el(x.getAttribute('aria-describedby')!);
    expect([css(title).hyphens, css(desc).hyphens, title.closest('[lang]')!.getAttribute('lang'), title.scrollWidth <= title.clientWidth, x.scrollWidth <= x.clientWidth]).toEqual(['auto', 'auto', 'de', true, true]);
    expect(css(title).getPropertyValue('hyphenate-limit-chars')).toBe('10 4 4');
  });

  test('swipe to dismiss: a touch drag sideways past a third, or a flick (even a gentle one), carries on at the finger\'s speed on ease-fling and closes it; a short slow drag, a vertical one or a mouse drag leave it', async () => {
    await withMotion(async () => {
      await render(<App />);
      React.act(() => { toast({ title: 'Swipe me', duration: 0 }); });
      await landed();
      const t = () => toasts()[0];
      const swipe = async (dx: number, dy: number, o: { type?: string; ms?: number; rest?: number } = {}) => {
        const r = t().getBoundingClientRect(), x = r.left + 40, y = r.top + 10, steps = 5;
        const ev = (name: string, cx: number, cy: number) => t().dispatchEvent(new PointerEvent(name, { bubbles: true, cancelable: true, pointerId: 9, isPrimary: true, pointerType: o.type || 'touch', clientX: cx, clientY: cy }));
        ev('pointerdown', x, y);
        for (let i = 1; i <= steps; i++) { await new Promise((f) => setTimeout(f, (o.ms ?? 100) / steps)); ev('pointermove', x + (dx * i) / steps, y + (dy * i) / steps); }
        if (o.rest) await new Promise((f) => setTimeout(f, o.rest));
        ev('pointerup', x + dx, y + dy);
      };
      const w = t().offsetWidth;
      await swipe(40, 0, { ms: 400, rest: 150 });
      await swipe(0, 200);
      await swipe(200, 0, { type: 'mouse' });
      await landed();
      expect([titles(), t().style.translate, t().style.opacity]).toEqual([['Swipe me'], '', '']);
      // Dragged past a third and held still: it still goes, briskly.
      await swipe(-(w / 3 + 20), 0, { ms: 300, rest: 150 });
      await expect.poll(titles).toEqual([]);
      // A flick: it leaves on ease-fling, toward the side it was flicked, then closes.
      React.act(() => { toast({ title: 'Flick me', duration: 0 }); });
      await landed();
      await swipe(80, 0, { ms: 60 });
      expect([t().style.translate, t().style.transition.includes('var(--ease-fling)')]).toEqual([w + 'px', true]);
      await expect.poll(titles).toEqual([]);
      // A gentle flick (about 0.3 px/ms, well short of a third) closes it too.
      React.act(() => { toast({ title: 'Nudge me', duration: 0 }); });
      await landed();
      await swipe(45, 0, { ms: 150 });
      await expect.poll(titles).toEqual([]);
    });
  });
  test('a string is a neutral toast with no icon, newest at the bottom for bottom positions; the same id replaces a toast in place; the close button dismisses it', async () => {
    await render(<App />);
    let id = '';
    React.act(() => { id = toast({ title: 'Changes saved', tone: 'success', duration: 0 }); toast('Plain message'); });
    expect(toasts().map((x) => x.dataset.tone + ':' + !!x.querySelector(':scope > span[aria-hidden] > [data-icon]'))).toEqual(['success:true', 'neutral:false']);
    React.act(() => { toast({ id, title: 'Saved again', tone: 'info', duration: 0 }); });
    expect(titles()).toEqual(['Saved again', 'Plain message']);
    await userEvent.click(q('.dk-toast:first-child button[aria-label="Dismiss"]'));
    expect(titles()).toEqual(['Plain message']);
  });

  test('toast.promise: a neutral "Saving…" that stays while pending, then the result in its place, success or danger (said at once), from a string or a function of the value; it returns the promise; two with the same words are two toasts', async () => {
    await render(<App />);
    let ok: (v: number) => void = () => {}, fail: (e: Error) => void = () => {};
    const a = new Promise<number>((r) => { ok = r; }), b = new Promise<number>((_, r) => { fail = r; });
    let back: Promise<number> | null = null;
    React.act(() => {
      back = toast.promise(a, { loading: 'Saving…', success: (n) => n + ' files saved', error: 'Couldn\'t save' });
      void toast.promise(() => b, { loading: 'Saving…', success: 'Saved', error: (e) => ({ title: 'Couldn\'t save', description: (e as Error).message }) });
    });
    expect([back === a, toasts().map((x) => x.dataset.tone + ':' + x.textContent.includes('Saving…'))]).toEqual([true, ['neutral:true', 'neutral:true']]);
    await new Promise((r) => setTimeout(r, 5200));
    expect(toasts().length).toBe(2);
    await React.act(async () => { ok(3); await a; });
    await expect.poll(() => titles()).toEqual(['3 files saved', 'Saving…']);
    await React.act(async () => { fail(new Error('The server is offline.')); await b.catch(() => {}); });
    await expect.poll(() => titles()).toEqual(['3 files saved', 'Couldn\'t save']);
    expect(toasts().map((x) => x.dataset.tone)).toEqual(['success', 'danger']);
    await expect.poll(() => q('[data-dk-announcer-assertive]').textContent).toBe('Couldn\'t save. The server is offline.');
  }, 15000);

  test('the action runs and closes the toast', async () => {
    await render(<App />);
    let undos = 0;
    React.act(() => { toast({ title: 'Moved to trash', action: { label: 'Undo', onClick: () => { undos++; } }, duration: 0 }); });
    await userEvent.click(q('.dk-toast button:not([aria-label])'));
    expect([undos, titles().length]).toEqual([1, 0]);
  });

  test('with an action it goes after the usual 5s like any other (FY1), unless autoDismiss is false; the first one tells screen readers about F8, once', async () => {
    await render(<App />);
    const said = new Set<string>();
    const watch = new MutationObserver(() => { const t = q('[data-dk-announcer]').textContent; if (t) said.add(t); });
    watch.observe(q('[data-dk-announcer]'), { childList: true, characterData: true, subtree: true });
    React.act(() => { toast({ title: 'Message deleted', action: { label: 'Undo', onClick: () => {} }, autoDismiss: false }); });
    await expect.poll(() => [...said].join(' | ')).toMatch(/Message deleted\. Press F8 to reach it\./);
    React.act(() => { toast({ title: 'Another deleted', action: { label: 'Undo', onClick: () => {} } }); });
    await expect.poll(() => [...said].join(' | ')).toMatch(/Another deleted/);
    expect([...said].some((t) => /Another deleted\. Press F8/.test(t))).toBe(false);
    watch.disconnect();
    await away();
    await settle(5300);
    await expect.poll(titles).toEqual(['Message deleted']);
  });

  test('once the Toaster is gone, a toast with an action doesn\'t mention F8', async () => {
    const r = await render(<App />);
    await r.unmount();
    const said = new Set<string>();
    const watch = new MutationObserver(() => { const t = q('[data-dk-announcer]').textContent; if (t) said.add(t); });
    watch.observe(q('[data-dk-announcer]'), { childList: true, characterData: true, subtree: true });
    React.act(() => { toast({ title: 'Archived', action: { label: 'Undo', onClick: () => {} } }); });
    await expect.poll(() => [...said].join(' | ')).toMatch(/Archived/);
    watch.disconnect();
    expect([...said].some((t) => /F8/.test(t))).toBe(false);
  });

  test('a toast closing with focus in it: focus goes back where F8 came from, else to the toast next to it; not after focus has left', async () => {
    await render(<><button id="before">Before</button><App /></>);
    let one = '', three = '';
    React.act(() => { one = toast({ title: 'One', duration: 0 }); toast({ title: 'Two', duration: 0 }); });
    await expect.poll(() => toasts().length).toBe(2);
    el('before').focus();
    await userEvent.keyboard('{F8}');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement!.getAttribute('aria-label') === 'Dismiss').toBe(true);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement!.id).toBe('before');
    toasts()[0].querySelector<HTMLElement>('button[aria-label="Dismiss"]')!.focus();   // reached without F8
    React.act(() => { three = toast({ title: 'Three', duration: 0 }); });
    React.act(() => { toast.dismiss(one); });
    await expect.poll(() => document.getElementById(document.activeElement!.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Three');
    (document.activeElement as HTMLElement).blur();
    await new Promise((r) => setTimeout(r, 20));
    React.act(() => { toast.dismiss(three); });
    await new Promise((r) => setTimeout(r, 20));
    expect(document.activeElement).toBe(document.body);
  });

  test('F8 moves focus to the newest toast (Tab then reaches its action) and F8 again goes back; Escape goes back too; with no toasts F8 does nothing', async () => {
    await render(<div><App /><button id="before">Before</button></div>);
    q('#before').focus();
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(q('#before'));
    React.act(() => { toast({ title: 'Old', duration: 0 }); toast({ title: 'Archived', action: { label: 'Undo', onClick: () => {} } }); });
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(toasts()[1]);
    expect(css(toasts()[1]).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement!.textContent).toBe('Undo');
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(q('#before'));
    await userEvent.keyboard('{F8}');
    await userEvent.keyboard('{Escape}');
    expect([document.activeElement, titles().length]).toEqual([q('#before'), 2]);
    React.act(() => setPos('top-end'));   // newest on top: F8 lands on the first one
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(toasts()[0]);
    expect(toasts()[0].textContent).toMatch(/Archived/);
  });

  test('it goes after its duration, and the time stops while it\'s hovered', async () => {
    await render(<App />);
    // 1s, hovered at once: a slow runner's hover round trip can't use the time up before the pointer lands.
    React.act(() => { toast({ title: 'Quick', duration: 1000 }); });
    await userEvent.hover(q('.dk-toast'));
    await settle(1200);   // past its 1s: only the hover keeps it
    expect(titles().length).toBe(1);
    await away();
    await expect.poll(() => titles().length, { timeout: 2500 }).toBe(0);
  });

  test('and while something in it has focus', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Focus me', duration: 300, action: { label: 'Open', onClick: () => {} } }); });
    await settle(100);
    q('.dk-toast button:not([aria-label])').focus();
    await settle(500);
    expect(titles().length).toBe(1);
    (document.activeElement as HTMLElement).blur();
    await expect.poll(() => titles().length, { timeout: 1500 }).toBe(0);
  });

  test('with focus inside, moving the mouse over and off the toast doesn\'t restart its time', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Keep me', duration: 300, action: { label: 'Open', onClick: () => {} } }); });
    await settle(100);
    q('.dk-toast button:not([aria-label])').focus();
    await userEvent.hover(q('.dk-toast'));
    await away();
    await settle(600);
    expect(titles().length).toBe(1);
    (document.activeElement as HTMLElement).blur();
    await expect.poll(() => titles().length, { timeout: 1500 }).toBe(0);
  });

  test('keyboard: Tab reaches the action button, then Dismiss; Enter on the action runs it and closes the toast', async () => {
    await render(<App />);
    let undos = 0;
    React.act(() => { toast({ title: 'Archived', action: { label: 'Undo', onClick: () => { undos++; } }, duration: 0 }); });
    (document.activeElement as HTMLElement | null)?.blur();
    let toAction = false;
    for (let i = 0; i < 10 && !toAction; i++) { await userEvent.keyboard('{Tab}'); toAction = document.activeElement!.matches('[data-toast] button:not([aria-label])'); }
    await userEvent.keyboard('{Tab}');
    expect([toAction, document.activeElement!.getAttribute('aria-label') === 'Dismiss']).toEqual([true, true]);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Enter}');
    await expect.poll(() => titles().length).toBe(0);
    expect(undos).toBe(1);
  });

  test('keyboard: Space on Dismiss closes the toast', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Saved', duration: 0 }); });
    q('button[aria-label="Dismiss"]').focus();
    await userEvent.keyboard(' ');
    await expect.poll(() => titles().length).toBe(0);
  });

  test('top-center: 16px from the top, centered, newest on top; bottom-start: 16px from the start edge', async () => {
    await render(<App />);
    React.act(() => { setPos('top-center'); toast({ title: 'First', duration: 0 }); toast({ title: 'Second', duration: 0 }); });
    await landed();
    const s = q('.dk-toaster').getBoundingClientRect();
    expect([Math.round(s.top), Math.round(s.left + s.width / 2), titles().join()]).toEqual([16, Math.round(innerWidth / 2), 'Second,First']);
    React.act(() => { toast.dismiss(); setPos('bottom-start'); toast({ title: 'info', duration: 0 }); });
    await landed();
    expect(Math.round(q('.dk-toaster').getBoundingClientRect().left)).toBe(16);
  });

  test('contrast: title and description 4.5:1, icons 3:1, for every tone in all six themes', async () => {
    await render(<Toaster limit={4} />);
    React.act(() => { (['info', 'success', 'warning', 'danger'] as const).forEach((k) => toast({ title: k, description: 'Details', tone: k, duration: 0 })); });
    const still = document.createElement('style'); still.textContent = '* { animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const x of toasts()) {
        const bg = css(x).backgroundColor;
        for (const [sel, min] of [['.dk-toast__title', 4.5], ['.dk-toast__description', 4.5], ['.dk-toast__icon', 3]] as const) { const r = contrast(css(x.querySelector(sel)).color, bg); n++; if (r < min) low.push(`${th} ${x.dataset.tone} ${sel}: ${r.toFixed(2)}`); }
      }
    }
    still.remove();
    expect([low, n]).toEqual([[], 72]);
  });

  test('look: 16px padding, 8px corners, a 1px border, shadow-lg; --toast-bg on the Toaster overrides every toast', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Look', duration: 0 }); toast({ title: 'Again', duration: 0 }); });
    const s = css(q('.dk-toast'));
    expect([s.paddingTop, s.borderTopLeftRadius, s.borderTopWidth]).toEqual(['16px', '8px', '1px']);
    expect(s.boxShadow).toMatch(/10px 15px -3px/);
    q('.dk-toaster').style.setProperty('--toast-bg', 'rgb(1, 2, 3)');
    expect(toasts().map((x) => css(x).backgroundColor)).toEqual(['rgb(1, 2, 3)', 'rgb(1, 2, 3)']);
  });

  test('a burst of the same message is one toast with a count ("×12", read as "12 times"); one with an id or an action is never merged', async () => {
    // In en-US whatever SERUPA_LOCALE the run uses: the count is in the locale's digits (GR25, tested below).
    await render(<SerupaProvider locale="en-US"><App /></SerupaProvider>);
    React.act(() => { for (let i = 0; i < 12; i++) toast({ title: 'Network error', tone: 'danger', duration: 0 }); });
    expect([toasts().length, q('.dk-toast__count [aria-hidden]').textContent, q('.dk-toast__count .dk-visually-hidden').textContent]).toEqual([1, '×12', ', 12 times']);
    React.act(() => { toast({ title: 'Network error', tone: 'warning', duration: 0 }); toast({ title: 'Network error', tone: 'danger', id: 'mine', duration: 0 }); toast({ title: 'Network error', tone: 'danger', duration: 0, action: { label: 'Retry', onClick: () => {} } }); });
    expect(toasts().length).toBe(3);   // the warning and the one with an id; the third waits past the limit
    expect(q('.dk-toaster__more').textContent).toBe('+1 more');
  });

  test('at most 3 show (newest nearest the edge), the rest wait under "+9 more", and none goes off screen; closing one brings the next back; limit sets the number', async () => {
    await render(<App />);
    React.act(() => { for (let i = 1; i <= 12; i++) toast({ title: 'Upload ' + i + ' failed', duration: 0 }); });
    await landed();
    expect([titles(), q('.dk-toaster__more').textContent]).toEqual([['Upload 10 failed', 'Upload 11 failed', 'Upload 12 failed'], '+9 more']);
    expect(Math.min(...toasts().map((x) => x.getBoundingClientRect().top), q('.dk-toaster__more').getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    await userEvent.click(toasts()[2].querySelector('button[aria-label="Dismiss"]')!);
    await expect.poll(titles).toEqual(['Upload 9 failed', 'Upload 10 failed', 'Upload 11 failed']);
    expect(q('.dk-toaster__more').textContent).toBe('+8 more');
    setPos('top-center');
    await expect.poll(() => q('.dk-toaster__list').lastElementChild!.className).toBe('dk-toaster__more');
    expect(titles()[0]).toBe('Upload 11 failed');
  });

  test('limit={1} shows only the newest; Indonesian words for the waiting line', async () => {
    const { idLabels } = await import('../../internal/labels');

    await render(<SerupaProvider labels={idLabels}><Toaster limit={1} /></SerupaProvider>);
    React.act(() => { toast({ title: 'A', duration: 0 }); toast({ title: 'B', duration: 0 }); toast({ title: 'C', duration: 0 }); });
    expect([titles(), q('.dk-toaster__more').textContent]).toEqual([['C'], '+2 lainnya']);
  });

  test('contrast: the count and the waiting line 4.5:1 in all six themes', async () => {
    await render(<App />);
    React.act(() => { for (const t of ['B', 'C', 'D']) toast({ title: t, duration: 0 }); toast({ title: 'Same', duration: 0 }); toast({ title: 'Same', duration: 0 }); });
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      await settle();
      const more = q('.dk-toaster__more'), count = q('.dk-toast__count');
      for (const [name, el, bg] of [['waiting line', more, css(more).backgroundColor], ['count', count, css(count.closest('[data-toast]')).backgroundColor]] as const) {
        const r = contrast(css(el).color, bg);
        if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('a replaced toast starts its time again', async () => {
    await render(<App />);
    React.act(() => { toast({ id: 'r', title: 'Saving…', duration: 400 }); });
    await settle(300);
    React.act(() => { toast({ id: 'r', title: 'Saved', duration: 400 }); });
    await settle(250);   // 550ms since the first: the replacement's own 400ms keeps it
    expect(titles()).toEqual(['Saved']);
    await expect.poll(() => titles().length, { timeout: 1500 }).toBe(0);
  });
});

// While a Dialog or Drawer is open the page behind it is inert: the toasts and the live regions move into it.
describe('Toast with a Dialog open', () => {
  let setOpen: (o: boolean) => void = () => {};
  function Modal({ drawer }: { drawer?: boolean }) {
    const [open, set] = React.useState(false); setOpen = set;
    const Box = drawer ? Drawer : Dialog;
    return <>
      <Toaster />
      <Box open={open} onOpenChange={set} title="Edit">
        <Button id="save" onClick={() => toast({ title: 'Couldn\'t save', tone: 'danger', action: { label: 'Retry', onClick: () => {} }, duration: 0 })}>Save</Button>
      </Box>
    </>;
  }

  test.each([['Dialog', false], ['Drawer', true]])('%s: a toast fired inside it can be seen and clicked, and the live regions sit inside it; they move back when it closes', async (_n, drawer) => {
    await render(<Modal drawer={drawer} />);
    React.act(() => setOpen(true));
    const modal = q('dialog[open]');
    await userEvent.click(q('#save'));
    await expect.poll(() => toasts().length).toBe(1);
    await landed();
    const r = q('.dk-toast__action, .dk-toast button').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    expect([modal.contains(q('.dk-toaster')), !!hit && q('.dk-toast').contains(hit)]).toEqual([true, true]);
    // A danger toast interrupts: the assertive region, inside the dialog.
    await expect.poll(() => q('[data-dk-announcer-assertive]')?.textContent).toBe('Couldn\'t save. Press F8 to reach it.');
    expect([modal.contains(q('[data-dk-announcer-assertive]')), modal.contains(q('[data-dk-announcer]')), q('[data-dk-announcer-assertive]').getAttribute('aria-live')]).toEqual([true, true, 'assertive']);
    React.act(() => setOpen(false));
    await expect.poll(() => q('.dk-toaster').parentElement === modal).toBe(false);
    expect([modal.contains(q('[data-dk-announcer]')), modal.contains(q('[data-dk-announcer-assertive]'))]).toEqual([false, false]);
  });

  test('a Button loading inside a Dialog is announced from inside it', async () => {
    function Loading() {
      const [busy, setBusy] = React.useState(false);
      return <Dialog open onOpenChange={() => {}} title="Upload"><Button id="up" loading={busy} onClick={() => setBusy(true)}>Upload</Button></Dialog>;
    }
    await render(<Loading />);
    const modal = q('dialog[open]');
    await userEvent.click(q('#up'));
    await expect.poll(() => q('[data-dk-announcer]').textContent).toBe('Loading…');
    expect(modal.contains(q('[data-dk-announcer]'))).toBe(true);
  });

  test('two quick announcements are both said, in turn', async () => {
    await render(<Toaster />);
    const seen = new Set<string>();
    const watch = new MutationObserver(() => { const t = q('[data-dk-announcer]').textContent; if (t) seen.add(t); });
    watch.observe(q('[data-dk-announcer]'), { childList: true, characterData: true, subtree: true });
    React.act(() => { toast('First'); toast('Second'); });
    // Said in turn, or together when another message was just said; never only the second.
    await expect.poll(() => [...seen].join(' | ')).toMatch(/First(\. | \| )Second/);
    watch.disconnect();
  });

  test('a burst is said when the toast first shows, and once more with the count a second after the last repeat (not twelve times); Indonesian count words', async () => {
    const said: string[] = [];
    await render(<App />);
    const watch = new MutationObserver(() => { const t = q('[data-dk-announcer]').textContent; if (t) said.push(t); });
    watch.observe(q('[data-dk-announcer]'), { childList: true, characterData: true, subtree: true });
    React.act(() => { toast({ title: 'Network error', duration: 0 }); });
    for (let i = 0; i < 11; i++) { await new Promise((r) => setTimeout(r, 50)); React.act(() => { toast({ title: 'Network error', duration: 0 }); }); }
    await expect.poll(() => said.filter((x) => /12 times/.test(x)).length, { timeout: 4000 }).toBe(1);
    await new Promise((r) => setTimeout(r, 1300));
    watch.disconnect();
    expect([...new Set(said)]).toEqual(['Network error', 'Network error. 12 times.']);
    expect(idLabels.toastRepeated(3)).toBe('3 kali');
  });
});

describe('Toast: motion (DZ1)', () => {
  const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
  const runs = (e: Element) => e.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => [(a).transitionProperty, ms(a)]).sort();
  const byTitle = (t: string) => toasts().find((x) => x.textContent.includes(t))!;
  test('slides in with a transition; closed, it fades and slides back toward its edge (kept, inert, until it ends) and the one left glides into its place at once, over 200ms; one there as the Toaster arrives is not slid in', async () => {
    await withMotion(async () => {
      await render(<App />);
      React.act(() => { toast({ title: 'First', duration: 0 }); });
      const first = byTitle('First');
      expect([runs(first), first.getAnimations().some((a) => a instanceof CSSAnimation)]).toEqual([[['opacity', 200], ['translate', 200]], false]);
      React.act(() => { toast({ title: 'Second', duration: 0 }); });
      await landed();
      const second = byTitle('Second');
      React.act(() => { toast.dismiss(second.dataset.toast); });
      // Bottom-end: the newest is last, nearest the edge; it leaves downward, toward it, and the first glides down.
      expect([second.isConnected, second.hasAttribute('data-leaving'), second.inert, runs(second)]).toEqual([true, true, true, [['opacity', 150], ['translate', 150]]]);
      // It leaves the flow at once, so the first glides into its place now, not once the fade has ended.
      const glide = first.getAnimations().find((a) => a.id === 'dk-toast-move');
      expect(glide && ms(glide)).toBe(200);
      await Promise.all(second.getAnimations().map((a) => a.finished));
      await expect.poll(() => second.isConnected).toBe(false);
      await landed();
      expect(css(first).translate).toBe('none');
    });
  });

  test('toasts there as the Toaster arrives are shown from the first frame', async () => {
    await withMotion(async () => {
      function Arrive() { React.useEffect(() => { toast({ title: 'Welcome back', duration: 0 }); }, []); return <Toaster />; }
      await render(<Arrive />);
      await expect.poll(() => toasts().length).toBe(1);
      expect([toasts()[0].hasAttribute('data-instant'), toasts()[0].getAnimations().length]).toEqual([true, 0]);
      React.act(() => { toast({ title: 'Later', duration: 0 }); });
      expect([byTitle('Later').hasAttribute('data-instant'), runs(byTitle('Later')).length]).toEqual([false, 2]);
    });
  });

  const frames = async (each: () => void) => { do { each(); await new Promise(requestAnimationFrame); } while (document.getAnimations().length); each(); };
  test('top-center, a fourth toast: the oldest folds toward "+1 more" where it was, and the ones left only ever move down to their place, never fading in again (FO1)', async () => {
    await withMotion(async () => {
      await render(<App />);
      setPos('top-center');
      React.act(() => { toast({ title: 'Moved to trash', action: { label: 'Undo', onClick: () => {} } }); });
      React.act(() => { toast({ title: 'Upload failed', tone: 'danger', duration: 0 }); });
      React.act(() => { toast({ title: 'Storage almost full', tone: 'warning', duration: 0 }); });
      await landed();
      const failed = byTitle('Upload failed'), trash = byTitle('Moved to trash');
      const tops: number[] = [], fades: string[] = [];
      React.act(() => { toast({ title: 'Update ready', tone: 'info', duration: 0 }); });
      // Newest on top, the waiting line last: the one pushed out stays below the one it was under.
      expect([trash.dataset.leaving, toasts().indexOf(trash) > toasts().indexOf(failed), q('.dk-toaster__more').textContent]).toEqual(['queued', true, '+1 more']);
      expect(runs(trash)).toEqual([['opacity', 150], ['scale', 150], ['translate', 150]]);
      await frames(() => { tops.push(Math.round(failed.getBoundingClientRect().top)); fades.push(css(failed).opacity); });
      expect([trash.isConnected, failed.getAnimations().filter((a) => a instanceof CSSTransition).length]).toEqual([false, 0]);
      expect(fades.filter((o) => o !== '1')).toEqual([]);
      expect(tops.filter((v, i) => i > 0 && v < tops[i - 1] - 1)).toEqual([]);
      expect(tops[tops.length - 1]).toBeGreaterThan(tops[0]);
    });
  });

  test('the waiting line fades in where it stays (the toast pushed out leaves the flow at once), and fades out once none wait (FO1)', async () => {
    await withMotion(async () => {
      await render(<Toaster limit={1} />);
      React.act(() => { toast({ title: 'One', duration: 0 }); });
      await landed();
      React.act(() => { toast({ title: 'Two', duration: 0 }); });
      const more = q('.dk-toaster__more');
      expect(runs(more)).toEqual([['opacity', 200]]);
      // The one pushed out leaves the flow at once, so the line appears where it stays: nothing moves a second time.
      await landed();
      expect(more.getAnimations().some((a) => a.id === 'dk-toast-move')).toBe(false);
      expect(Math.round(byTitle('Two').getBoundingClientRect().top - more.getBoundingClientRect().bottom)).toBe(8);
      React.act(() => { toast.dismiss(byTitle('Two').dataset.toast); });
      await expect.poll(() => more.hasAttribute('data-leaving')).toBe(true);
      expect([more.isConnected, more.textContent, runs(more)]).toEqual([true, '+1 more', [['opacity', 150]]]);
      await landed();
      await expect.poll(() => more.isConnected).toBe(false);
    });
  });
});

describe('Toast: time in the waiting line (FO1)', () => {
  test('a toast pushed into the waiting line keeps its time running there, so they go in the order they came', async () => {
    await render(<><App /><button id="out">Out</button></>);
    await away();
    const order: string[] = [];
    const spy = vi.spyOn(toast, 'dismiss');
    try {
      for (const n of [1, 2, 3, 4]) { React.act(() => { toast({ id: 'q' + n, title: 'Note ' + n, duration: 700 }); }); await new Promise((r) => setTimeout(r, 40)); }
      expect(titles()).toEqual(['Note 2', 'Note 3', 'Note 4']);
      await expect.poll(() => toasts().length + (q('.dk-toaster__more') ? 1 : 0), { timeout: 4000 }).toBe(0);
      for (const [id] of spy.mock.calls) if (id && !order.includes(id)) order.push(id);
      expect(order).toEqual(['q1', 'q2', 'q3', 'q4']);
    } finally { spy.mockRestore(); }
  });

  test('never shown: with limit={1}, the older of two arriving together waits with its time stopped, and gets all of it once shown', async () => {
    await render(<Toaster limit={1} />);
    await away();
    React.act(() => { toast({ title: 'Older', duration: 300 }); toast({ title: 'Newer', duration: 0 }); });
    await new Promise((r) => setTimeout(r, 500));
    expect([titles(), q('.dk-toaster__more').textContent]).toEqual([['Newer'], '+1 more']);
    React.act(() => { toast.dismiss(toasts()[0].dataset.toast); });
    await expect.poll(titles).toEqual(['Older']);
    await new Promise((r) => setTimeout(r, 150));
    expect(titles()).toEqual(['Older']);
    await expect.poll(titles, { timeout: 2000 }).toEqual([]);
  });

  test('closed with the mouse, focus isn\'t handed to the toast next to it, so that one\'s time keeps running (FO1)', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Stays a while', duration: 600 }); toast({ title: 'Close me', duration: 0 }); });
    await expect.poll(() => toasts().length).toBe(2);
    await userEvent.click(toasts()[1].querySelector('button[aria-label="Dismiss"]')!);
    await away();
    await expect.poll(titles).toEqual(['Stays a while']);
    expect(toasts()[0].contains(document.activeElement)).toBe(false);
    await expect.poll(titles, { timeout: 2000 }).toEqual([]);
  });
});

describe('Toast: autoDismiss and the Toaster\'s defaults (FY1)', () => {
  const gone = (ms: number) => new Promise((r) => setTimeout(r, ms));
  test('the Toaster\'s duration is every toast\'s time unless one sets its own; duration 0 still keeps one up', async () => {
    await render(<Toaster duration={300} limit={5} />);
    await away();
    React.act(() => { toast('Quick'); toast({ title: 'Own time', duration: 2000 }); toast({ title: 'Kept', duration: 0 }); toast({ title: 'Undo me', action: { label: 'Undo', onClick: () => {} } }); });
    expect(titles()).toEqual(['Quick', 'Own time', 'Kept', 'Undo me']);
    await gone(900);
    expect(titles()).toEqual(['Own time', 'Kept']);
  });

  test('autoDismiss false keeps a toast until it\'s closed; on the Toaster it keeps them all, and a toast\'s own true wins', async () => {
    const screen = await render(<Toaster duration={300} autoDismiss={false} />);
    await away();
    React.act(() => { toast('Stays'); toast({ title: 'Goes', autoDismiss: true }); });
    await gone(900);
    expect(titles()).toEqual(['Stays']);
    // Back to the default on the Toaster: "Stays" now goes on time, and only a toast's own false keeps one up.
    await screen.rerender(<Toaster duration={300} />);
    React.act(() => { toast({ title: 'Must act', tone: 'danger', autoDismiss: false }); });
    await gone(900);
    expect(titles()).toEqual(['Must act']);
  });

  test('toast.undo: an Undo button that runs onUndo instead of commit; commit runs once when it closes any other way (time, ×, dismiss, leaving the page) (12)', async () => {
    await render(<Toaster duration={400} limit={5} />);
    await away();
    const log: string[] = [];
    const make = (n: string) => toast.undo({ title: n + ' moved to trash', commit: () => log.push('commit ' + n), onUndo: () => log.push('undo ' + n), duration: n === 'a' ? 400 : 0 });
    const ids: string[] = [];
    React.act(() => { for (const n of ['a', 'b', 'c', 'd']) ids.push(make(n)); });
    expect(toasts().map((x) => undoButton(x).textContent)).toEqual(['Undo', 'Undo', 'Undo', 'Undo']);
    const of = (n: string) => toasts().find((x) => x.textContent.includes(n + ' moved'))!;
    undoButton(of('b')).click();
    (of('c').querySelector('button[aria-label]') as HTMLButtonElement).click();   // ×, the one named by aria-label
    await expect.poll(() => log.includes('commit a'), { timeout: 3000 }).toBe(true);
    window.dispatchEvent(new Event('pagehide'));
    React.act(() => toast.dismiss());
    expect([...log].sort()).toEqual(['commit a', 'commit c', 'commit d', 'undo b']);
    expect(new Set(ids).size).toBe(4);   // each its own toast, not a count on one
  });

  test('FEC5: toast.undo commits when the page is left, and a page brought back from the back/forward cache drops the toast, whose Undo can no longer undo', async () => {
    await render(<Toaster />);
    const log: string[] = [];
    React.act(() => { toast.undo({ title: 'Deleted', commit: () => log.push('commit'), onUndo: () => log.push('undo') }); });
    expect(toasts().length).toBe(1);
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    React.act(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    await expect.poll(() => toasts().length, { timeout: 3000 }).toBe(0);
    expect(log).toEqual(['commit']);
  });

  test('GR25: the repeat count is written in the locale\'s digits, as Badge writes its count', async () => {

    await render(<SerupaProvider locale="ar-EG"><Toaster /></SerupaProvider>);
    React.act(() => { for (let i = 0; i < 12; i++) toast({ title: 'Network error', duration: 0 }); });
    expect(toasts()[0].textContent).toContain('×١٢');
  });

  test('TF4: each toast\'s Dismiss is described by that toast\'s title, so three of them are told apart', async () => {
    await render(<Toaster />);
    React.act(() => { toast({ title: 'Saved' }); toast({ title: 'Copied' }); });
    const said = toasts().map((x) => {
      const b = x.querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')!;
      return b.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent).join(' ');
    });
    expect(said.sort()).toEqual(['Copied', 'Saved']);
  });

  test('toast.undo: "Undo" in the provider\'s labels, or undoLabel (12)', async () => {

    await render(<SerupaProvider labels={idLabels}><Toaster /></SerupaProvider>);
    React.act(() => { toast.undo({ title: 'Dihapus', commit: () => {} }); toast.undo({ title: 'Archived', commit: () => {}, undoLabel: 'Restore' }); });
    expect(toasts().map((x) => undoButton(x).textContent)).toEqual(['Urungkan', 'Restore']);
  });

  test('toast.promise keeps its loading toast up however short the Toaster\'s duration, then the result goes on time', async () => {
    await render(<Toaster duration={300} />);
    await away();
    let finish: (v: string) => void = () => {};
    React.act(() => { void toast.promise(new Promise<string>((r) => { finish = r; }), { loading: 'Saving…', success: 'Saved', error: 'Failed' }); });
    await gone(900);
    expect(titles()).toEqual(['Saving…']);
    React.act(() => finish('ok'));
    await expect.poll(titles).toEqual(['Saved']);
    await expect.poll(titles, { timeout: 2000 }).toEqual([]);
  });
});

describe('Toast on a phone (GQ1)', () => {
  test('at a phone width an action goes under the text, lined up with it, so the text keeps its width; at full width it stays beside it', async () => {
    const desc = 'The Northwind integration was turned off for the whole workspace.';
    const at = (w: string) => <Toaster style={{ '--toast-width': w } as React.CSSProperties} />;
    const screen = await render(at('288px'));
    React.act(() => { toast({ title: 'Integration disconnected', description: desc, tone: 'danger', action: { label: 'Reconnect', onClick: () => {} } }); toast({ title: 'Archived', description: desc, action: { label: 'Undo', onClick: () => {} } }); });
    await expect.poll(() => toasts().length).toBe(2);
    await landed();
    const probe = () => toasts().map((t) => {
      const text = t.querySelector('p')!.parentElement!.getBoundingClientRect(), act = undoButton(t).getBoundingClientRect();
      return [text.width > 180, act.top >= text.bottom, Math.round(act.left - text.left)];
    });
    // Before, the danger toast's text was 95px wide and the toast 216px tall.
    expect(probe()).toEqual([[true, true, 0], [true, true, 0]]);
    await screen.rerender(at('384px'));
    expect(probe().map(([, under]) => under)).toEqual([false, false]);
  });
  test('at a phone width a long action label wraps onto more lines under the text, whole, not cut with an ellipsis (GR74)', async () => {
    const label = 'Reconnect the Northwind integration now';
    await render(<Toaster style={{ '--toast-width': '288px' } as React.CSSProperties} />);
    React.act(() => { toast({ title: 'Integration disconnected', action: { label, onClick: () => {} } }); });
    await expect.poll(() => toasts().length).toBe(1);
    await landed();
    const t = toasts()[0], b = undoButton(t), r = b.getBoundingClientRect(), q = t.getBoundingClientRect();
    const text = [...b.querySelectorAll('*')].find((x) => x.textContent === label) as HTMLElement;
    expect([r.right <= q.right + 0.5, text.scrollWidth <= text.clientWidth + 1, r.height > 30, b.textContent]).toEqual([true, true, true, label]);
  });
});

describe('Toaster on a short screen (GQ1b)', () => {
  test('a phone in landscape (568 by 320): only the toasts that fit show, the rest wait under the "+N more" line, and nothing goes past the top; a taller screen shows them all again', async () => {
    await page.viewport(568, 320);
    try {
      await render(<Toaster />);
      React.act(() => { for (let i = 1; i <= 3; i++) toast({ title: 'Report ' + i + ' is ready', description: 'Quarterly numbers for the finance team, with every region and each product line broken out', action: { label: 'Open', onClick: () => {} }, duration: 0 }); });
      await landed();
      const top = () => Math.min(...[...document.querySelectorAll<HTMLElement>('[data-toast]:not([data-leaving]), ol > li:not([data-toast])')].map((x) => x.getBoundingClientRect().top));
      await expect.poll(top).toBeGreaterThanOrEqual(0);
      expect(titles().at(-1)).toBe('Report 3 is ready');   // the newest shows
      expect(q('ol > li:not([data-toast])')?.textContent).toMatch(/^\+\d more$/);
      await page.viewport(568, 900);
      await expect.poll(() => toasts().filter((x) => !x.hasAttribute('data-leaving')).length).toBe(3);
    } finally { await page.viewport(900, 700); }
  });
});

describe('Toaster inside a shadow root (GR60)', () => {
  test('F8 reaches the newest toast and F8 again goes back to the field it came from', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      await render(<><input aria-label="Shadow field" /><Toaster /></>, { container: inner });
      const root = host.shadowRoot!, field = root.querySelector('input')!;
      React.act(() => { toast({ title: 'In the shadow', duration: 0 }); });
      await expect.poll(() => root.querySelectorAll('[data-toast]').length).toBe(1);
      field.focus();
      await userEvent.keyboard('{F8}');
      await expect.poll(() => !!root.activeElement?.closest('[data-toast]')).toBe(true);
      await userEvent.keyboard('{F8}');
      await expect.poll(() => root.activeElement).toBe(field);
    } finally { React.act(() => { toast.dismiss(); }); host.remove(); }
  });
});
