import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { KeyboardShortcuts, useShortcut, type ShortcutOptions } from './KeyboardShortcuts';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const dialog = () => document.querySelector<HTMLDialogElement>('dialog[open]');
// What the open dialog lists: [group heading or "", [[description, the keycaps' shown text], ...]] (the shown text, not
// the names screen readers hear, which are checked in Kbd.test.tsx).
const caps = (dd: Element) => [...dd.querySelectorAll('kbd kbd')].map((k) => (k.querySelector('[aria-hidden]') || k).textContent).join('+');
const listed = () => [...dialog()!.querySelectorAll('section')].map((s) => [s.querySelector('h3')?.textContent || '',
  [...s.querySelectorAll('dt')].map((dt) => [dt.textContent, caps(dt.nextElementSibling!)])]);
// The first ancestor with a background of its own.
const backdropOf = (e: HTMLElement): string => { for (let x: HTMLElement | null = e; x; x = x.parentElement) { const bg = css(x).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg; } return 'rgb(255, 255, 255)'; };

function Shortcut({ keys, log, name, ...options }: { keys: string[]; log: string[]; name: string } & ShortcutOptions) {
  useShortcut(keys, () => log.push(name), options);
  return null;
}

describe('useShortcut', () => {
  test('a letter matches what the layout types, and by position only when it types no Latin letter (AZERTY, Cyrillic, Mac Option) (L8E16)', async () => {
    const log: string[] = [];
    await render(<SerupaProvider platform="other">
      <Shortcut keys={['mod', 'Q']} log={log} name="quit" /><Shortcut keys={['mod', 'A']} log={log} name="all" />
    </SerupaProvider>);
    const press = (key: string, code: string) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, code, ctrlKey: true, bubbles: true, cancelable: true }));
    press('a', 'KeyQ');   // AZERTY: the key in Q's place types "a"
    press('q', 'KeyA');   // and the one in A's place types "q"
    press('й', 'KeyQ');   // Russian: the key in Q's place
    expect(log).toEqual(['all', 'quit', 'quit']);
  });

  test('runs on its keys anywhere on the page ("mod" is Ctrl off Apple devices); not while typing unless it has mod; the newest wins; gone when unmounted or disabled', async () => {
    const log: string[] = [];
    const screen = await render(<SerupaProvider platform="other">
      <input id="field" /><button id="btn">Button</button>
      <Shortcut keys={['mod', 'K']} log={log} name="search" />
      <Shortcut keys={['N']} log={log} name="new" />
      <Shortcut keys={['N']} log={log} name="newer" />
      <Shortcut keys={['shift', 'up']} log={log} name="up" />
    </SerupaProvider>);
    el('btn').focus();
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.keyboard('n');
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    await userEvent.keyboard('{ArrowUp}');   // without Shift: not it
    await userEvent.keyboard('{Meta>}k{/Meta}');   // ⌘ isn't mod off Apple devices
    expect(log).toEqual(['search', 'newer', 'up']);
    el('field').focus();
    await userEvent.keyboard('n{Control>}k{/Control}');
    expect([log, (el('field') as HTMLInputElement).value]).toEqual([['search', 'newer', 'up', 'search'], 'n']);
    log.length = 0;
    el('btn').focus();
    await screen.rerender(<SerupaProvider platform="other">
      <Shortcut keys={['N']} log={log} name="new" enabled={false} />
      <Shortcut keys={['shift', 'up']} log={log} name="up" />
    </SerupaProvider>);
    await userEvent.keyboard('n{Control>}k{/Control}{Shift>}{ArrowUp}{/Shift}');
    expect(log).toEqual(['up']);
  });

  test('"mod" is ⌘ on Apple devices; a key something else already handled, or one in a text field without inInputs, is left alone', async () => {
    const log: string[] = [];
    await render(<SerupaProvider platform="apple">
      <div onKeyDown={(e) => { if (e.key === 'x') e.preventDefault(); }}><button id="inside">Inside</button></div>
      <textarea id="text" />
      <Shortcut keys={['mod', 'K']} log={log} name="search" />
      <Shortcut keys={['X']} log={log} name="x" />
      <Shortcut keys={['/']} log={log} name="slash" inInputs />
    </SerupaProvider>);
    el('inside').focus();
    await userEvent.keyboard('{Meta>}k{/Meta}{Control>}k{/Control}x');
    el('text').focus();
    await userEvent.keyboard('/');
    expect([log, (el('text') as HTMLTextAreaElement).value]).toEqual([['search', 'slash'], '']);
  });

  test('typing in a text field inside a web component\'s shadow root doesn\'t run a plain-key shortcut (L8E43)', async () => {
    const log: string[] = [];
    await render(<><div id="host" /><Shortcut keys={['G']} log={log} name="g" /></>);
    const field = document.createElement('input');
    el('host').attachShadow({ mode: 'open' }).append(field);
    field.focus();
    await userEvent.keyboard('g');
    expect([log, field.value]).toEqual([[], 'g']);
  });

  test('keys that aren\'t one key with its modifiers (["G", "I"], ["mod"]) aren\'t set up: a lone I doesn\'t run it, it isn\'t listed, and it warns once (GQ3)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const log: string[] = [];
      await render(<SerupaProvider platform="other">
        <button id="gq3">Button</button>
        <Shortcut keys={['G', 'I']} log={log} name="inbox" description="Go to inbox" />
        <Shortcut keys={['mod']} log={log} name="mod" description="Nothing" />
        <Shortcut keys={['Shift', 'I']} log={log} name="info" description="Show info" />
        <KeyboardShortcuts />
      </SerupaProvider>);
      el('gq3').focus();
      await userEvent.keyboard('gi{Control}{Shift>}i{/Shift}');
      await userEvent.keyboard('?');
      expect([log, listed(), warn.mock.calls.filter(([m]) => String(m).includes('shortcut-keys')).length]).toEqual([['info'], [['', [['Show info', 'Shift+I'], ['Show keyboard shortcuts', '?']]]], 2]);
    } finally { warn.mockRestore(); }
  });
});

describe('KeyboardShortcuts', () => {
  test('? opens a dialog listing each shortcut with a description, by group, keys in Kbd; Escape closes it and focus goes back; shortcuts wait while it\'s open', async () => {
    const log: string[] = [];
    await render(<SerupaProvider platform="other">
      <button id="before">Before</button>
      <Shortcut keys={['mod', 'K']} log={log} name="search" description="Search" group="Navigation" />
      <Shortcut keys={['C']} log={log} name="compose" description="New message" group="Messages" />
      <Shortcut keys={['H']} log={log} name="hidden" />
      <KeyboardShortcuts id="ks" shortcuts={[{ keys: ['mod', 'B'], description: 'Bold', group: 'Messages' }]} />
    </SerupaProvider>);
    el('before').focus();
    await userEvent.keyboard('?');
    await expect.poll(() => dialog()?.id).toBe('ks');
    expect([dialog()!.querySelector('h2')!.textContent, dialog()!.classList.contains('dk-keyboard-shortcuts')]).toEqual(['Keyboard shortcuts', true]);
    expect(listed()).toEqual([
      ['Messages', [['Bold', 'Ctrl+B'], ['New message', 'C']]],
      ['Navigation', [['Search', 'Ctrl+K']]],
      ['General', [['Show keyboard shortcuts', '?']]],
    ]);
    expect(dialog()!.querySelectorAll('dd > kbd').length).toBe(4);
    await userEvent.keyboard('c');
    expect(log).toEqual([]);   // the page is inert behind the dialog
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog()).toBe(null);
    expect(document.activeElement).toBe(el('before'));
    await userEvent.keyboard('c');
    expect(log).toEqual(['compose']);
  });

  test('one group shows no heading; helpKeys changes the keys or turns them off; open and onOpenChange control it', async () => {
    const changes: boolean[] = [];
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return <><button id="open" onClick={() => setOpen(true)}>Shortcuts</button>
        <KeyboardShortcuts id="ks" helpKeys={false} open={open} onOpenChange={(o) => { changes.push(o); setOpen(o); }} /></>;
    }
    // platform="other": WebKit in Playwright says Mac on any OS, and would draw Shift as ⇧.
    const screen = await render(<SerupaProvider platform="other"><KeyboardShortcuts id="ks" helpKeys={['shift', 'F1']} title="Shortcuts" /></SerupaProvider>);
    await userEvent.keyboard('?');
    expect(dialog()).toBe(null);
    await userEvent.keyboard('{Shift>}{F1}{/Shift}');
    await expect.poll(() => dialog()?.querySelector('h2')?.textContent).toBe('Shortcuts');
    expect(listed()).toEqual([['', [['Show keyboard shortcuts', 'Shift+F1']]]]);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog()).toBe(null);
    await screen.rerender(<SerupaProvider platform="other"><Controlled /></SerupaProvider>);
    await userEvent.keyboard('?');
    expect(dialog()).toBe(null);
    await userEvent.click(el('open'));
    await expect.poll(() => dialog()?.id).toBe('ks');
    expect(listed()).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog()).toBe(null);
    expect(changes).toEqual([false]);
  });

  test('Indonesian labels from the provider', async () => {
    await render(<SerupaProvider labels={idLabels}><KeyboardShortcuts defaultOpen /></SerupaProvider>);
    await expect.poll(() => dialog()?.querySelector('h2')?.textContent).toBe('Pintasan keyboard');
    expect(listed()).toEqual([['', [['Tampilkan pintasan keyboard', '?']]]]);
  });

  test('group headings read 4.5:1 on the dialog in all six themes', async () => {
    await render(<KeyboardShortcuts defaultOpen shortcuts={[{ keys: ['A'], description: 'One', group: 'First' }, { keys: ['B'], description: 'Two', group: 'Second' }]} />);
    await expect.poll(() => dialog() !== null).toBe(true);
    const heading = dialog()!.querySelector('h3') as HTMLElement;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(heading).color, backdropOf(heading)), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});
