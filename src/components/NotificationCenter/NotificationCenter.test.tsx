import * as React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { toast } from '../Toast/Toast';
import { NotificationCenter, useToastHistory, type NotificationItem, type ToastHistory } from './NotificationCenter';

const drawer = () => document.querySelector<HTMLDialogElement>('dialog[open]');
const rows = () => [...drawer()!.querySelectorAll('li')];
// Each row as read aloud: its title (with "Unread: " when unread) and description, and its buttons' names.
const read = () => rows().map((li) => [[...li.querySelectorAll('p')].map((p) => p.textContent).join(' / '), [...li.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))]);
const button = (name: string) => [...drawer()!.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.textContent) === name) as HTMLButtonElement;
// The first ancestor with a background of its own.
const backdropOf = (e: HTMLElement): string => { for (let x: HTMLElement | null = e; x; x = x.parentElement) { const bg = css(x).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg; } return 'rgb(255, 255, 255)'; };

const list: NotificationItem[] = [
  { id: 'a', title: 'Payment failed', description: 'Card declined.', tone: 'danger', time: Date.now() - 120000 },
  { id: 'b', title: 'Invoice sent', tone: 'success', read: true },
];

function Controlled(props: { log: string[] }) {
  const [items, setItems] = React.useState(list);
  return <NotificationCenter defaultOpen items={items}
    onMarkRead={(id) => { props.log.push('read ' + id); setItems((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))); }}
    onMarkAllRead={() => props.log.push('all')} onClear={() => props.log.push('clear')} />;
}

describe('NotificationCenter', () => {
  test('a drawer titled "Notifications" listing each one: unread ones say so and have "Mark as read", read ones neither; the time is relative', async () => {
    // en-US: the relative time below is in the provider's language, not the browser's (which CI also runs in ar, id, th, ja).
    await render(<SerupaProvider locale="en-US"><NotificationCenter defaultOpen items={list} onMarkRead={() => {}} /></SerupaProvider>);
    await expect.poll(() => drawer()?.querySelector('h2')?.textContent).toBe('Notifications');
    expect(read()).toEqual([['Unread: Payment failed / Card declined.', ['Mark as read']], ['Invoice sent', []]]);
    expect(rows()[0].querySelector('time')?.textContent).toMatch(/2 min/);
    expect(rows()[0].dataset.tone).toBe('danger');
    expect(rows()[1].hasAttribute('data-read')).toBe(true);
  });

  test('"Mark as read" calls onMarkRead with the id and focus stays on its row; the footer buttons call theirs', async () => {
    const log: string[] = [];
    await render(<Controlled log={log} />);
    await expect.poll(() => drawer() !== null).toBe(true);
    button('Mark as read').focus();
    await userEvent.keyboard('{Enter}');
    expect(log).toEqual(['read a']);
    await expect.poll(() => read()[0]).toEqual(['Payment failed / Card declined.', []]);
    expect(document.activeElement).toBe(rows()[0]);
    await userEvent.click(button('Mark all as read'));
    await userEvent.click(button('Clear all'));
    expect(log).toEqual(['read a', 'all', 'clear']);
  });

  test('an inbox that hides read ones: "Mark as read" takes its row away, and focus goes to the row in its place, then the last, then the empty line, not to the page', async () => {
    const three: NotificationItem[] = [{ id: 'a', title: 'One' }, { id: 'b', title: 'Two' }, { id: 'c', title: 'Three' }];
    function Unread() {
      const [items, setItems] = React.useState(three);
      return <NotificationCenter defaultOpen items={items} onMarkRead={(id) => setItems((l) => l.filter((n) => n.id !== id))} />;
    }
    await render(<Unread />);
    await expect.poll(() => drawer() !== null).toBe(true);
    const mark = async (row: Element) => { row.querySelector('button')!.focus(); await userEvent.keyboard('{Enter}'); };
    const focusIs = () => [rows().map((li) => li.querySelector('p span[id]')!.textContent), document.activeElement!.tagName, (document.activeElement!.querySelector('p span[id]') || document.activeElement!).textContent];
    await mark(rows()[0]);
    await expect.poll(focusIs).toEqual([['Two', 'Three'], 'LI', 'Two']);
    await mark(rows()[1]);   // the last: the one before
    await expect.poll(focusIs).toEqual([['Two'], 'LI', 'Two']);
    await mark(rows()[0]);   // none left: the empty line
    await expect.poll(focusIs).toEqual([[], 'P', 'No notifications yet']);
  });

  test('each "Mark as read" is described by its own row\'s title, so two read differently, and keeps its tooltip (TF4)', async () => {
    const two: NotificationItem[] = [{ id: 'p', title: 'Payment failed' }, { id: 'q', title: 'Invoice paid', description: 'INV-204' }];
    await render(<NotificationCenter defaultOpen items={two} onMarkRead={() => {}} />);
    await expect.poll(() => drawer() !== null).toBe(true);
    const marks = [...drawer()!.querySelectorAll('button')].filter((b) => b.getAttribute('aria-label') === 'Mark as read');
    expect(marks.map((b) => [(b.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent).join(' '), b.title]))
      .toEqual([['Payment failed', 'Mark as read'], ['Invoice paid', 'Mark as read']]);
  });

  test('no footer buttons or "Mark as read" without their handlers; the empty line with none', async () => {
    await render(<NotificationCenter defaultOpen items={[]} />);
    await expect.poll(() => drawer() !== null).toBe(true);
    expect(drawer()!.querySelectorAll('button').length).toBe(1);   // the ×
    expect(drawer()!.textContent).toContain('No notifications yet');
  });

  test('side, size and the other Drawer props go to the Drawer', async () => {
    const screen = await render(<NotificationCenter defaultOpen items={list} side="left" size="sm" />);
    await expect.poll(() => drawer()?.dataset.side).toBe('left');
    expect(drawer()!.dataset.size).toBe('sm');
    for (const [side, size] of [['top', 'md'], ['bottom', 'lg'], ['right', 'md']] as const) {
      await screen.rerender(<NotificationCenter defaultOpen items={list} side={side} size={size} closeButton={false} />);
      expect([drawer()!.dataset.side, drawer()!.dataset.size]).toEqual([side, size]);
    }
    expect(drawer()!.querySelectorAll('button').length).toBe(0);   // closeButton={false}: no ×
  });

  test('Indonesian labels from the provider', async () => {
    await render(<SerupaProvider labels={idLabels}><NotificationCenter defaultOpen items={list} onMarkRead={() => {}} onMarkAllRead={() => {}} onClear={() => {}} /></SerupaProvider>);
    await expect.poll(() => drawer()?.querySelector('h2')?.textContent).toBe('Notifikasi');
    expect(read()[0]).toEqual(['Belum dibaca: Payment failed / Card declined.', ['Tandai sudah dibaca']]);
    expect(button('Tandai semua sudah dibaca')).toBeTruthy();
    expect(button('Hapus semua')).toBeTruthy();
  });

  test('descriptions read 4.5:1 and the unread dot 3:1 on the drawer in all six themes', async () => {
    await render(<NotificationCenter defaultOpen items={list} />);
    await expect.poll(() => drawer() !== null).toBe(true);
    const description = rows()[0].querySelectorAll('p')[1] as HTMLElement;
    const dot = [...rows()[0].querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].find((s) => !s.childElementCount)!;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(description).color, backdropOf(description)), th).toBeGreaterThanOrEqual(4.5);
      expect(contrast(css(dot).backgroundColor, backdropOf(dot.parentElement!)), th).toBeGreaterThanOrEqual(3);
    }
  });

  test('forced colors: the unread dot stays drawn, in CanvasText on the Canvas drawer (GR27)', async () => {
    await render(<NotificationCenter defaultOpen items={list} />);
    await expect.poll(() => drawer() !== null).toBe(true);
    const dot = [...rows()[0].querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].find((s) => !s.childElementCount)!;
    await forcedColors(async (active) => {
      if (!active) return;
      // Compared as computed values: contrast() resolves colors through `color`, which forced colors also override.
      const probe = (bg: string) => { const p = document.createElement('span'); p.style.cssText = 'forced-color-adjust:none;background:' + bg; document.body.append(p); const c = css(p).backgroundColor; p.remove(); return c; };
      expect([css(dot).backgroundColor === probe('CanvasText'), css(dot).backgroundColor === probe('Canvas')]).toEqual([true, false]);
    });
  });
});

describe('useToastHistory', () => {
  afterEach(() => toast.dismiss());
  let history: ToastHistory;
  function Recorder(props: { limit?: number }) { history = useToastHistory(props); return null; }

  test('keeps each toast shown while mounted, newest first and unread; a replaced one stays one entry, a repeat goes back to the top', async () => {
    toast('Before it mounted');
    await render(<Recorder />);
    await expect.poll(() => history.items.length).toBe(0);
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const saving = toast('Saving…');
    toast({ title: 'Network error', tone: 'danger' });
    toast({ title: 'Saved', tone: 'success', id: saving });
    vi.mocked(Date.now).mockRestore();
    await expect.poll(() => history.items.map((n) => [n.title, n.tone, n.read])).toEqual([['Saved', 'success', false], ['Network error', 'danger', false]]);
    expect(history.items[0].time).toBe(1000);
    expect(history.unread).toBe(2);
    toast({ title: 'Network error', tone: 'danger' });   // a repeat: "×2" in the Toaster
    await expect.poll(() => history.items.map((n) => n.title)).toEqual(['Network error', 'Saved']);
  });

  test('markRead(id) marks one, markRead() every one, clear() empties it; limit keeps the newest', async () => {
    await render(<Recorder limit={2} />);
    toast('One'); toast('Two'); toast('Three');
    await expect.poll(() => history.items.map((n) => n.title)).toEqual(['Three', 'Two']);
    history.markRead(history.items[1].id);
    await expect.poll(() => history.items.map((n) => !!n.read)).toEqual([false, true]);
    expect(history.unread).toBe(1);
    history.markRead();
    await expect.poll(() => history.unread).toBe(0);
    history.clear();
    await expect.poll(() => history.items).toEqual([]);
  });
});
