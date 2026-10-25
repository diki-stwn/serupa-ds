import * as React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, settle } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import { Drawer } from '../Drawer/Drawer';
import { toast, Toaster, type ToasterPosition } from './Toast';
import { idLabels } from '../../internal/labels';

const toasts = () => [...document.querySelectorAll<HTMLElement>('.dk-toast')];
const titles = () => toasts().map((x) => x.querySelector('.dk-toast__title')!.textContent);
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

describe('Toast', () => {
  test('the Toaster is a <section> named "Notifications" holding a list, and the shared live region exists', async () => {
    await render(<App />);
    const s = q('.dk-toaster');
    expect([s.tagName, s.getAttribute('aria-label'), s.firstElementChild!.tagName, !!document.querySelector('[data-dk-announcer]')]).toEqual(['SECTION', 'Notifications', 'OL', true]);
    expect(s.className).toMatch(/extra/);
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
    expect([x.querySelector<HTMLElement>('.dk-toast__icon .dk-icon')?.dataset.icon, x.querySelector('button[aria-label="Dismiss"]')!.getAttribute('aria-label')]).toEqual(['check_circle', 'Dismiss']);
    expect([r.width, Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom)]).toEqual([384, 16, 16]);
  });

  test('a string is a neutral toast with no icon, newest at the bottom for bottom positions; the same id replaces a toast in place; the close button dismisses it', async () => {
    await render(<App />);
    let id = '';
    React.act(() => { id = toast({ title: 'Changes saved', tone: 'success', duration: 0 }); toast('Plain message'); });
    expect(toasts().map((x) => x.dataset.tone + ':' + !!x.querySelector('.dk-toast__icon'))).toEqual(['success:true', 'neutral:false']);
    React.act(() => { toast({ id, title: 'Saved again', tone: 'info', duration: 0 }); });
    expect(titles()).toEqual(['Saved again', 'Plain message']);
    await userEvent.click(q('.dk-toast:first-child .dk-toast__close'));
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
    await userEvent.click(q('.dk-toast__action'));
    expect([undos, titles().length]).toEqual([1, 0]);
  });

  test('with an action and no duration it stays (past the usual 5s), so there\'s time to reach the button; the first one tells screen readers about F8, once', async () => {
    await render(<App />);
    const said = new Set<string>();
    const watch = new MutationObserver(() => { const t = q('[data-dk-announcer]').textContent; if (t) said.add(t); });
    watch.observe(q('[data-dk-announcer]'), { childList: true, characterData: true, subtree: true });
    React.act(() => { toast({ title: 'Message deleted', action: { label: 'Undo', onClick: () => {} } }); });
    await expect.poll(() => [...said].join(' | ')).toMatch(/Message deleted\. Press F8 to reach it\./);
    React.act(() => { toast({ title: 'Another deleted', action: { label: 'Undo', onClick: () => {} } }); });
    await expect.poll(() => [...said].join(' | ')).toMatch(/Another deleted/);
    expect([...said].some((t) => /Another deleted\. Press F8/.test(t))).toBe(false);
    watch.disconnect();
    await settle(5300);
    expect(titles()).toEqual(['Message deleted', 'Another deleted']);
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
    expect(document.activeElement!.classList.contains('dk-toast__close')).toBe(true);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.activeElement!.id).toBe('before');
    toasts()[0].querySelector<HTMLElement>('button[aria-label="Dismiss"]')!.focus();   // reached without F8
    React.act(() => { three = toast({ title: 'Three', duration: 0 }); });
    React.act(() => { toast.dismiss(one); });
    await expect.poll(() => document.activeElement!.querySelector('.dk-toast__title')?.textContent).toBe('Three');
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
    React.act(() => { toast({ title: 'Quick', duration: 400 }); });
    await settle(250);
    await userEvent.hover(q('.dk-toast'));
    await settle(500);   // past its 400ms: only the hover keeps it
    expect(titles().length).toBe(1);
    await away();
    await expect.poll(() => titles().length, { timeout: 1500 }).toBe(0);
  });

  test('and while something in it has focus', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Focus me', duration: 300, action: { label: 'Open', onClick: () => {} } }); });
    await settle(100);
    q('.dk-toast__action').focus();
    await settle(500);
    expect(titles().length).toBe(1);
    (document.activeElement as HTMLElement).blur();
    await expect.poll(() => titles().length, { timeout: 1500 }).toBe(0);
  });

  test('with focus inside, moving the mouse over and off the toast doesn\'t restart its time', async () => {
    await render(<App />);
    React.act(() => { toast({ title: 'Keep me', duration: 300, action: { label: 'Open', onClick: () => {} } }); });
    await settle(100);
    q('.dk-toast__action').focus();
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
    for (let i = 0; i < 10 && !toAction; i++) { await userEvent.keyboard('{Tab}'); toAction = document.activeElement!.classList.contains('dk-toast__action'); }
    await userEvent.keyboard('{Tab}');
    expect([toAction, document.activeElement!.classList.contains('dk-toast__close')]).toEqual([true, true]);
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
    await render(<App />);
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
    const { SerupaProvider } = await import('../../internal/provider');
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
      for (const [name, el, bg] of [['waiting line', more, css(more).backgroundColor], ['count', count, css(count.closest('.dk-toast')).backgroundColor]] as const) {
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
