import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { CommandPalette, type Command } from './CommandPalette';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const isOpen = (id: string) => (el(id) as HTMLDialogElement).open;
const field = () => document.querySelector<HTMLInputElement>('dialog [role="combobox"]')!;
// The first ancestor with a background of its own (the dialog's panel).
const backdropOf = (e: HTMLElement): string => { for (let x: HTMLElement | null = e; x; x = x.parentElement) { const bg = css(x).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg; } return 'rgb(255, 255, 255)'; };
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const labels = () => options().map((o) => o.textContent);
const activeLabel = () => document.getElementById(field().getAttribute('aria-activedescendant') || '')?.textContent;
const headings = () => [...document.querySelectorAll('[role="group"]')].map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent);

const COMMANDS: Command[] = [
  { id: 'home', label: 'Home', group: 'Pages' },
  { id: 'settings', label: 'Settings', group: 'Pages', keywords: ['preferences'] },
  { id: 'new', label: 'New project', group: 'Actions' },
  { id: 'off', label: 'Archive project', group: 'Actions', disabled: true },
  { id: 'theme', label: 'Switch theme', group: 'Actions' },
];

describe('CommandPalette', () => {
  test('a modal <dialog> named "Command palette"; ref, className and other props reach it; focus starts in the combobox', async () => {
    const ref = React.createRef<HTMLDialogElement>();
    await render(<CommandPalette id="p" ref={ref} className="extra" data-x="y" defaultOpen commands={COMMANDS} />);
    const d = el('p') as HTMLDialogElement;
    expect([d.tagName, d.open, ref.current === d, d.classList.contains('dk-command-palette'), d.classList.contains('extra'), d.dataset.x, d.getAttribute('aria-label')])
      .toEqual(['DIALOG', true, true, true, true, 'y', 'Command palette']);
    await expect.poll(() => document.activeElement).toBe(field());
    const f = field();
    expect([f.getAttribute('role'), f.getAttribute('aria-expanded'), document.getElementById(f.getAttribute('aria-controls')!)?.getAttribute('role'), f.getAttribute('aria-label')])
      .toEqual(['combobox', 'true', 'listbox', 'Search commands and pages']);
    expect(headings()).toEqual(['Pages', 'Actions']);
    expect(labels()).toEqual(['Home', 'Settings', 'New project', 'Archive project', 'Switch theme']);
    expect(activeLabel()).toBe('Home');
    expect(options()[3].getAttribute('aria-disabled')).toBe('true');
  });

  test('typing filters, ignoring case and accents, best matches first, by keyword too; nothing matched shows the empty text', async () => {
    await render(<CommandPalette defaultOpen commands={[...COMMANDS, { id: 'cafe', label: 'Café menu' }]} />);
    await userEvent.type(field(), 'pro');
    expect(labels()).toEqual(['New project', 'Archive project']);
    await userEvent.clear(field());
    await userEvent.type(field(), 'cafe');
    expect([labels(), headings()]).toEqual([['Café menu'], ['Commands']]);
    expect(document.querySelector('[role="option"] mark')?.textContent).toBe('Café');
    await userEvent.clear(field());
    await userEvent.type(field(), 'PREFER');
    expect(labels()).toEqual(['Settings']);
    await userEvent.clear(field());
    await userEvent.type(field(), 's');
    expect(labels().slice(0, 2)).toEqual(['Settings', 'Switch theme']);   // starts with "s" before only has an "s"
    await userEvent.type(field(), 'zzz');
    expect([labels(), document.querySelector('dialog[open] p')?.textContent, field().hasAttribute('aria-activedescendant')]).toEqual([[], 'No matching commands', false]);
  });

  test('ArrowDown and ArrowUp move over the enabled rows and wrap; PageUp and PageDown go to the ends; Enter chooses', async () => {
    const onSelect = vi.fn(), log: string[] = [], onOpenChange = vi.fn();
    const commands = COMMANDS.map((c) => ({ ...c, onSelect: () => log.push(c.id) }));
    await render(<CommandPalette id="p" defaultOpen commands={commands} onSelect={onSelect} onOpenChange={onOpenChange} />);
    await expect.poll(() => document.activeElement).toBe(field());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(activeLabel()).toBe('Switch theme');   // passes over the disabled row
    await userEvent.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Home');
    await userEvent.keyboard('{ArrowUp}');
    expect(activeLabel()).toBe('Switch theme');
    await userEvent.keyboard('{PageUp}');
    expect(activeLabel()).toBe('Home');
    await userEvent.keyboard('{PageDown}{ArrowUp}');
    expect(activeLabel()).toBe('New project');
    await userEvent.keyboard('{Enter}');
    expect([log, onSelect.mock.calls.map((c) => (c[0] as Command).id), onOpenChange.mock.calls[0]]).toEqual([['new'], ['new'], [false, { reason: 'select' }]]);
    await expect.poll(() => isOpen('p')).toBe(false);
  });

  test('a press on a row leaves focus in the field; a row focused another way (as a screen reader can) is chosen with Enter', async () => {
    const onSelect = vi.fn();
    await render(<CommandPalette id="p" defaultOpen commands={COMMANDS} onSelect={onSelect} />);
    await expect.poll(() => document.activeElement).toBe(field());
    options()[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(field());
    options()[2].focus();
    await userEvent.keyboard('{Enter}');
    expect((onSelect.mock.calls[0][0] as Command).id).toBe('new');
  });

  test('a click chooses; a disabled row does nothing; a row with only href goes there', async () => {
    const onSelect = vi.fn();
    const before = location.hash;
    try {
      await render(<CommandPalette id="p" defaultOpen commands={[...COMMANDS, { id: 'docs', label: 'Docs', href: '#cmdk-docs' }]} onSelect={onSelect} />);
      options()[3].click();
      expect([onSelect.mock.calls.length, isOpen('p')]).toEqual([0, true]);
      options()[5].click();
      await expect.poll(() => onSelect.mock.calls.length).toBe(1);
      expect([location.hash, (onSelect.mock.calls[0][0] as Command).id, isOpen('p')]).toEqual(['#cmdk-docs', 'docs', false]);
    } finally { history.replaceState(null, '', before || location.pathname + location.search); }
  });

  test('a command runs after the palette has closed and given focus back: its onSelect can focus a field on the page (GR97)', async () => {
    const order: string[] = [];
    function App() {
      const [open, setOpen] = React.useState(false);
      return <>
        <button id="opener" onClick={() => setOpen(true)}>Commands</button>
        <input id="q" aria-label="Search" />
        <CommandPalette id="p" open={open} onOpenChange={setOpen} onSelect={() => order.push('palette ' + (document.activeElement?.id || ''))}
          commands={[{ id: 'focus', label: 'Focus search', onSelect: () => { order.push('command ' + String(isOpen('p'))); el('q').focus(); } }]} />
      </>;
    }
    await render(<App />);
    el('opener').focus();
    el('opener').click();
    await expect.poll(() => isOpen('p')).toBe(true);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => order).toEqual(['command false', 'palette q']);
    await expect.poll(() => document.activeElement?.id).toBe('q');
  });

  test('forced colors: the active row has an outline in Highlight (GR98)', async () => {
    await render(<CommandPalette id="p" defaultOpen commands={COMMANDS} />);
    await forcedColors(async (active) => {
      if (!active) return;
      const on = el(field().getAttribute('aria-activedescendant')!), off = options().find((o) => o !== on)!;
      expect([css(on).outlineStyle, css(off).outlineStyle]).toEqual(['solid', 'none']);
    });
  });

  test('Ctrl+K (⌘K on Apple devices), or its hotkey, opens it from anywhere; each opening starts empty; hotkey false turns it off', async () => {
    const page = (hotkey?: string[] | false) => <SerupaProvider platform="other"><button id="b">B</button><CommandPalette id="p" commands={COMMANDS} hotkey={hotkey} /></SerupaProvider>;
    const screen = await render(page());
    el('b').focus();
    await userEvent.keyboard('{Control>}k{/Control}');
    await expect.poll(() => isOpen('p')).toBe(true);
    await expect.poll(() => document.activeElement).toBe(field());
    await userEvent.type(field(), 'set');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('p')).toBe(false);
    await userEvent.keyboard('{Control>}k{/Control}');
    await expect.poll(() => isOpen('p')).toBe(true);
    expect([field().value, labels().length]).toEqual(['', 5]);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('p')).toBe(false);
    await screen.rerender(page(['mod', 'P']));
    el('b').focus();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(isOpen('p')).toBe(false);
    await userEvent.keyboard('{Control>}p{/Control}');
    await expect.poll(() => isOpen('p')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen('p')).toBe(false);
    await screen.rerender(page(false));
    el('b').focus();
    await userEvent.keyboard('{Control>}k{/Control}{Control>}p{/Control}');
    expect(isOpen('p')).toBe(false);
  });

  test('how many match is said once typing stops, and "No matching commands" when none do', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    try {
      await render(<CommandPalette defaultOpen commands={COMMANDS} />);
      await userEvent.type(field(), 'pro');
      await expect.poll(() => said.at(-1)).toBe('1 command');   // the disabled one isn't counted
      await userEvent.type(field(), 'zzz');
      await expect.poll(() => said.at(-1)).toBe('No matching commands');
    } finally { seen.disconnect(); }
  });

  test('the pointer over a row makes it the active one; over a disabled row it stays where it was', async () => {
    await render(<CommandPalette defaultOpen commands={COMMANDS} />);
    expect(activeLabel()).toBe('Home');
    const row = (label: string) => options().find((o) => o.textContent === label)!;
    await userEvent.hover(row('Switch theme'));
    await expect.poll(() => activeLabel()).toBe('Switch theme');
    await userEvent.hover(row('Archive project'));
    await new Promise((r) => setTimeout(r, 50));
    expect(activeLabel()).toBe('Switch theme');
    expect(document.activeElement).toBe(field());
  });

  test('in Indonesian: its name, the field and the count it says come from the id labels', async () => {
    const said: string[] = [];
    const seen = new MutationObserver(() => { const t = document.querySelector('[data-dk-announcer]')?.textContent; if (t) said.push(t); });
    seen.observe(document.body, { subtree: true, childList: true, characterData: true });
    try {
      await render(<SerupaProvider locale="id-ID" labels={idLabels}><CommandPalette id="cp" defaultOpen commands={COMMANDS} /></SerupaProvider>);
      expect([el('cp').getAttribute('aria-label'), field().getAttribute('aria-label')]).toEqual(['Palet perintah', 'Cari perintah dan halaman']);
      await userEvent.type(field(), 'pro');
      await expect.poll(() => said.at(-1)).toBe('1 perintah');
    } finally { seen.disconnect(); }
  });

  test('limit caps the rows while searching', async () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ id: 'c' + i, label: 'Command ' + i }));
    await render(<CommandPalette defaultOpen commands={many} limit={10} />);
    expect(labels().length).toBe(80);
    await userEvent.type(field(), 'com');
    expect(labels().length).toBe(10);
  });

  test('its field, headings, rows and active row read 4.5:1 in all six themes', async () => {
    await render(<CommandPalette id="p" defaultOpen commands={COMMANDS} />);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = backdropOf(field());
      const check = (name: string, e: Element, on = bg) => { const r = contrast(css(e).color, on); if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`); };
      check('field', field());
      check('heading', document.getElementById(document.querySelector('[role="group"]')!.getAttribute('aria-labelledby')!)!);
      check('row', options()[1]);
      const act = document.querySelector('[role="option"][aria-selected="true"]')!;
      const actBg = css(act).backgroundColor;
      check('active', act, actBg === 'rgba(0, 0, 0, 0)' ? bg : actBg);
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
    expect(low).toEqual([]);
  });
});
