import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, press, settle } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import { keyShortcuts, Menu, MenuGroup, MenuItem, MenuSeparator, MenuSub } from './Menu';
import { page } from 'vitest/browser';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const menuOf = (id: string) => document.getElementById(el(id).getAttribute('aria-controls') || '') as HTMLElement;
const openMenu = () => [...document.querySelectorAll<HTMLElement>('[role="menu"]')].find((m) => !m.hidden);
// The focused item's label, or the focused element's id.
const focus = () => { const a = document.activeElement as HTMLElement; return a.getAttribute('role') === 'menuitem' ? a.querySelector('.dk-menu__label')!.textContent : a.id; };
const rect = (e: Element) => e.getBoundingClientRect();
// Distances in CSS px: the test page may be drawn scaled, which leaves layout px a fraction off.
const near = (a: number, b: number) => Math.abs(a - b) <= 1;

function Actions({ chosen }: { chosen: string[] }) {
  const pick = (k: string) => () => { chosen.push(k); };
  return <Menu trigger={<Button id="mb" variant="secondary" rightIcon="expand_more">Actions</Button>}>
    <MenuItem icon="edit" shortcut="⌘E" onSelect={pick('edit')}>Edit</MenuItem>
    <MenuItem icon="content_copy" onSelect={pick('dup')}>Duplicate</MenuItem>
    <MenuItem disabled onSelect={pick('arch')}>Archive</MenuItem>
    <MenuItem href="#share" id="lnk" onSelect={pick('share')}>Share link</MenuItem>
    <MenuSeparator />
    <MenuGroup label="Danger zone"><MenuItem icon="delete" destructive onSelect={pick('del')}>Delete</MenuItem></MenuGroup>
  </Menu>;
}

function Nested({ chosen, dir }: { chosen: string[]; dir?: 'rtl' }) {
  const pick = (k: string) => () => { chosen.push(k); };
  return <div dir={dir} style={{ padding: '0 300px' }}><Menu trigger={<Button id="nb">File</Button>}>
    <MenuItem onSelect={pick('new')}>New</MenuItem>
    <MenuSub id="share" icon="share" label="Share">
      <MenuItem onSelect={pick('email')}>Email</MenuItem>
      <MenuItem onSelect={pick('link')}>Copy link</MenuItem>
      <MenuSub id="more" label="More apps"><MenuItem onSelect={pick('chat')}>Chat</MenuItem></MenuSub>
    </MenuSub>
    <MenuItem onSelect={pick('close')}>Close</MenuItem>
  </Menu></div>;
}
const sub = (id: string) => document.getElementById(el(id).getAttribute('aria-controls') || '');

describe('Menu', () => {
  test('closed: the button has aria-haspopup="menu" and aria-expanded="false"; the menu is empty and hidden', async () => {
    await render(<Actions chosen={[]} />);
    const b = el('mb'), m = document.querySelector('[role="menu"]') as HTMLElement;
    expect([b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded'), b.getAttribute('aria-controls')]).toEqual(['menu', 'false', null]);
    expect([m.getAttribute('aria-labelledby'), m.hidden, m.children.length]).toEqual(['mb', true, 0]);
  });

  test('click opens it under the button (start-aligned, 4px away, at least 192px, top layer) on the first item; items have tabindex -1; groups are named', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    await Promise.all(document.getAnimations().map((a) => a.finished));
    const b = el('mb'), m = menuOf('mb'), g = m.querySelector('[role="group"]')!;
    expect([b.getAttribute('aria-expanded'), m.getAttribute('role'), m.matches(':popover-open')]).toEqual(['true', 'menu', true]);
    expect([near(rect(m).top - rect(b).bottom, 4), near(rect(m).left, rect(b).left), m.offsetWidth >= 192]).toEqual([true, true, true]);
    expect([...m.querySelectorAll<HTMLElement>('[role="menuitem"]')].map((x) => x.tabIndex)).toEqual([-1, -1, -1, -1, -1]);
    expect(document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent).toBe('Danger zone');
    expect([!!m.querySelector('[role="separator"]'), m.querySelectorAll('[aria-disabled="true"]').length, m.querySelector('kbd')!.textContent]).toEqual([true, 1, '⌘E']);
    expect(focus()).toBe('Edit');
  });

  test('keys: ↓ ↑ move and wrap, disabled items are still reachable, Home and End jump, a letter goes to the next item starting with it', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    const seen: string[] = [];
    for (const k of ['{ArrowDown}', '{ArrowDown}', '{End}', '{ArrowDown}', '{ArrowUp}', '{Home}', 's', 'd', 'd']) { await userEvent.keyboard(k); seen.push(focus()); }
    expect(seen).toEqual(['Duplicate', 'Archive', 'Delete', 'Edit', 'Delete', 'Edit', 'Share link', 'Delete', 'Duplicate']);
  });

  test('typing a word goes to the item starting with it: "de" passes Duplicate for Delete; after a pause a letter starts again', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    await userEvent.keyboard('de');
    expect(focus()).toBe('Delete');
    await userEvent.keyboard('du');
    expect(focus()).toBe('Duplicate');
    await new Promise((r) => setTimeout(r, 600));
    await userEvent.keyboard('e');
    expect(focus()).toBe('Edit');
  });

  test('Enter on a disabled item does nothing; Enter on an item chooses it, closes the menu and returns focus to the button', async () => {
    const chosen: string[] = [];
    await render(<Actions chosen={chosen} />);
    await userEvent.click(el('mb'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect([!!openMenu(), chosen.join()]).toEqual([true, '']);
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect([!!openMenu(), chosen.join(), focus(), el('mb').getAttribute('aria-expanded')]).toEqual([false, 'dup', 'mb', 'false']);
  });

  test('↑ on the button opens it on the last item, ↓ on the first; Escape closes it; Space chooses; Tab closes it and moves on', async () => {
    const chosen: string[] = [];
    await render(<><Actions chosen={chosen} /><button id="after">After</button></>);
    el('mb').focus();
    await userEvent.keyboard('{ArrowUp}');
    expect([!!openMenu(), focus()]).toEqual([true, 'Delete']);
    await userEvent.keyboard('{Escape}');
    expect([!!openMenu(), focus()]).toEqual([false, 'mb']);
    await userEvent.keyboard('{ArrowDown}');
    expect(focus()).toBe('Edit');
    await userEvent.keyboard(' ');
    expect([!!openMenu(), chosen.join()]).toEqual([false, 'edit']);
    await userEvent.keyboard('{Enter}');
    expect(!!openMenu()).toBe(true);
    await userEvent.keyboard('{Tab}');
    await settle(50);
    expect(!!openMenu()).toBe(false);
    expect(focus()).not.toBe('mb');
  });

  test('hover highlights (focuses) an item; a click outside closes it', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    await userEvent.hover(menuOf('mb').querySelectorAll('[role="menuitem"]')[1]);
    expect(focus()).toBe('Duplicate');
    await userEvent.click(document.body, { position: { x: 800, y: 500 } });
    expect(!!openMenu()).toBe(false);
  });

  test('a link item is an <a> with href; following it runs onSelect and closes the menu', async () => {
    const chosen: string[] = [];
    await render(<Actions chosen={chosen} />);
    await userEvent.click(el('mb'));
    expect([el('lnk').tagName, el('lnk').getAttribute('href')]).toEqual(['A', '#share']);
    await userEvent.click(el('lnk'));
    expect([chosen.join(), !!openMenu(), location.hash]).toEqual(['share', false, '#share']);
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('aria-label names the menu; bottom-end lines up the ends; onSelect with preventDefault keeps it open', async () => {
    const chosen: string[] = [];
    await render(<div style={{ paddingLeft: '300px' }}><Menu trigger={<IconButton id="ib" icon="more_vert" label="More" />} placement="bottom-end" aria-label="Row actions">
      <MenuItem onSelect={(e) => { e.preventDefault(); chosen.push('stay'); }}>Stay open</MenuItem><MenuItem>Two</MenuItem>
    </Menu></div>);
    await userEvent.click(el('ib'));
    await settle(100);
    const m = menuOf('ib');
    expect([m.getAttribute('aria-label'), m.getAttribute('aria-labelledby'), near(rect(m).right, rect(el('ib')).right)]).toEqual(['Row actions', null, true]);
    await userEvent.keyboard('{Enter}');
    expect([!!openMenu(), chosen.join()]).toEqual([true, 'stay']);
  });

  test('controlled: a click only asks; open decides; --menu-bg overrides one menu', async () => {
    const opens: boolean[] = [];
    let setOpen: (v: boolean) => void = () => {};
    function Controlled() {
      const [open, set] = React.useState(false); setOpen = set;
      return <Menu trigger={<button id="cb">Controlled</button>} open={open} onOpenChange={(v) => { opens.push(v); }} style={{ '--menu-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}><MenuItem>One</MenuItem></Menu>;
    }
    await render(<Controlled />);
    await userEvent.click(el('cb'));
    expect([!!openMenu(), opens.join()]).toEqual([false, 'true']);
    React.act(() => setOpen(true));
    await settle(100);
    expect(getComputedStyle(menuOf('cb')).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('a new placement while open moves it there', async () => {
    const menu = (placement: 'bottom-start' | 'top-start') => <div style={{ paddingTop: '200px' }}><Menu placement={placement} trigger={<button id="pm">Move</button>}><MenuItem>One</MenuItem></Menu></div>;
    const { rerender } = await render(menu('bottom-start'));
    await userEvent.click(el('pm'));
    expect(menuOf('pm').dataset.side).toBe('bottom');
    await rerender(menu('top-start'));
    expect(menuOf('pm').dataset.side).toBe('top');
  });

  test('MenuSub: an item with aria-haspopup and a chevron; → opens its submenu at the end edge on its first item; ← closes it back on the item', async () => {
    await render(<Nested chosen={[]} />);
    await userEvent.click(el('nb'));
    await userEvent.keyboard('{ArrowDown}');
    const item = el('share');
    expect([focus(), item.getAttribute('aria-haspopup'), item.getAttribute('aria-expanded'), !!item.querySelector('.dk-menu__chevron .dk-icon')]).toEqual(['Share', 'menu', 'false', true]);
    await userEvent.keyboard('{ArrowRight}');
    const panel = sub('share')!;
    expect([focus(), item.getAttribute('aria-expanded'), panel.getAttribute('role'), panel.matches(':popover-open')]).toEqual(['Email', 'true', 'menu', true]);
    expect(document.getElementById(panel.getAttribute('aria-labelledby')!)!.textContent).toBe('Share');
    expect([rect(panel).left >= rect(item).right - 8, near(rect(panel).top, rect(item).top)]).toEqual([true, true]);
    await userEvent.keyboard('{ArrowLeft}');
    expect([focus(), item.getAttribute('aria-expanded'), sub('share')]).toEqual(['Share', 'false', null]);
  });

  test('MenuSub: ↑ ↓ Home End and letters stay inside the submenu; Escape closes only the submenu, a second Escape the menu', async () => {
    await render(<Nested chosen={[]} />);
    await userEvent.click(el('nb'));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    const seen: string[] = [];
    for (const k of ['{ArrowDown}', '{ArrowDown}', '{ArrowDown}', '{End}', '{Home}', 'c', 'm', 'n']) { await userEvent.keyboard(k); seen.push(focus()); }
    expect(seen).toEqual(['Copy link', 'More apps', 'Email', 'More apps', 'Email', 'Copy link', 'More apps', 'More apps']);
    await userEvent.keyboard('{Escape}');
    expect([focus(), !!openMenu()]).toEqual(['Share', true]);
    await userEvent.keyboard('{Escape}');
    expect([focus(), !!openMenu()]).toEqual(['nb', false]);
  });

  test('MenuSub: choosing an item two levels down closes every menu and focus goes back to the button', async () => {
    const chosen: string[] = [];
    await render(<Nested chosen={chosen} />);
    await userEvent.click(el('nb'));
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{End}{ArrowRight}');
    expect(focus()).toBe('Chat');
    await userEvent.keyboard('{Enter}');
    expect([chosen.join(), !!openMenu(), focus()]).toEqual(['chat', false, 'nb']);
  });

  test('MenuSub: hovering the item opens it after a moment, a click opens it at once; moving to another item closes it', async () => {
    await render(<Nested chosen={[]} />);
    await userEvent.click(el('nb'));
    await userEvent.hover(el('share'));
    expect(sub('share')).toBe(null);
    await expect.poll(() => el('share').getAttribute('aria-expanded')).toBe('true');
    expect(focus()).toBe('Share');
    await userEvent.hover(sub('share')!.querySelector('[role="menuitem"]')!);
    await settle(250);
    expect([focus(), el('share').getAttribute('aria-expanded')]).toEqual(['Email', 'true']);
    await userEvent.hover(menuOf('nb').querySelector('[role="menuitem"]')!);
    await expect.poll(() => el('share').getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(el('share'));
    expect([el('share').getAttribute('aria-expanded'), focus()]).toEqual(['true', 'Email']);
  });

  test('MenuSub in rtl: ← opens it on the left, → closes it; the chevron points left', async () => {
    await render(<Nested chosen={[]} dir="rtl" />);
    await userEvent.click(el('nb'));
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    expect(sub('share')).toBe(null);
    await userEvent.keyboard('{ArrowLeft}');
    const item = el('share'), panel = sub('share')!;
    expect([focus(), rect(panel).right <= rect(item).left + 8]).toEqual(['Email', true]);
    expect([getComputedStyle(item.querySelector('.dk-menu__ltr')!).display, getComputedStyle(item.querySelector('.dk-menu__rtl')!).display !== 'none']).toEqual(['none', true]);
    await userEvent.keyboard('{ArrowRight}');
    expect([focus(), sub('share')]).toEqual(['Share', null]);
  });

  test('MenuSub disabled: reachable, but → Enter and a click don\'t open it', async () => {
    await render(<Menu trigger={<Button id="db">More</Button>}><MenuItem>One</MenuItem><MenuSub id="ds" disabled label="Move to"><MenuItem>A</MenuItem></MenuSub></Menu>);
    await userEvent.click(el('db'));
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}');
    expect([focus(), el('ds').getAttribute('aria-disabled'), sub('ds')]).toEqual(['Move to', 'true', null]);
    el('ds').click();   // Playwright won't click an aria-disabled item
    await settle(50);
    expect(sub('ds')).toBe(null);
  });

  test('look: 4px padding, 8px corners, shadow-lg; 32px items, text-sm, 6px corners, 16px icons', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    await Promise.all(document.getAnimations().map((a) => a.finished));
    const m = menuOf('mb'), it = m.querySelector<HTMLElement>('[role="menuitem"]')!, s = getComputedStyle(m), i = getComputedStyle(it);
    expect([s.paddingTop, s.borderTopLeftRadius, it.offsetHeight, i.fontSize, i.borderTopLeftRadius]).toEqual(['4px', '8px', 32, '14px', '6px']);
    expect(s.boxShadow).toMatch(/10px 15px -3px/);
    expect(getComputedStyle(it.querySelector('.dk-icon')!).fontSize).toBe('16px');
  });

  test('a long label wraps inside a menu at most 320px wide (--menu-max-width), even under a narrow button (BH2)', async () => {
    const long = 'Move this conversation to the archive and stop notifications about it from now on';
    await render(<Menu trigger={<Button id="mw" size="sm">More</Button>}><MenuItem>Short</MenuItem><MenuItem id="ml">{long}</MenuItem></Menu>);
    await userEvent.click(el('mw'));
    await Promise.all(document.getAnimations().map((a) => a.finished));
    const m = menuOf('mw'), short = m.querySelector<HTMLElement>('[role="menuitem"]')!, item = el('ml');
    expect([near(rect(m).width, 320), short.offsetHeight, item.offsetHeight > 32, item.scrollWidth <= item.clientWidth]).toEqual([true, 32, true, true]);
  });

  test('shortcut: shown as <kbd>, left out of the item\'s name, and given as aria-keyshortcuts; your own aria-keyshortcuts wins', async () => {
    await render(<Menu open trigger={<Button id="ks">More</Button>}>
      <MenuItem shortcut="⌘E">Edit</MenuItem>
      <MenuItem shortcut="Ctrl+Shift+P" aria-keyshortcuts="Control+Shift+KeyP">Palette</MenuItem>
      <MenuItem>Plain</MenuItem>
    </Menu>);
    const items = [...menuOf('ks').querySelectorAll<HTMLElement>('[role=menuitem]')];
    expect(items.map((i) => i.getAttribute('aria-keyshortcuts'))).toEqual(['Meta+E', 'Control+Shift+KeyP', null]);
    expect([items[0].querySelector('kbd')!.textContent, items[0].querySelector('kbd')!.getAttribute('aria-hidden')]).toEqual(['⌘E', 'true']);
    await expect.element(page.getByRole('menuitem', { name: 'Edit', exact: true })).toBeInTheDocument();
  });

  test('keyShortcuts: Mac symbols written together, words with + or spaces, named keys, single letters upper case', () => {
    expect(['⌘K', '⌘⇧K', '⌥⌘I', 'Ctrl+Shift+P', 'ctrl + c', 'Alt F4', 'Cmd+Enter', '⇧Tab', 'Esc', '?', 'Delete'].map(keyShortcuts))
      .toEqual(['Meta+K', 'Meta+Shift+K', 'Alt+Meta+I', 'Control+Shift+P', 'Control+C', 'Alt+F4', 'Meta+Enter', 'Shift+Tab', 'Escape', '?', 'Delete']);
  });

  test('contrast: labels, shortcuts and group labels 4.5:1 (also highlighted), icons 3:1, in all six themes', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    const still = document.createElement('style'); still.textContent = '* { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const m = menuOf('mb'), items = m.querySelectorAll<HTMLElement>('[role="menuitem"]'), first = items[0], second = items[1], del = items[items.length - 1];
    const c = (e: Element) => getComputedStyle(e).color, bgOf = (e: Element) => getComputedStyle(e).backgroundColor;
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = bgOf(m), checks: Array<[string, string, string, number]> = [];
      second.focus();
      checks.push(['label', c(first), bg, 4.5], ['shortcut', c(first.querySelector('kbd')!), bg, 4.5], ['group label', c(m.querySelector('.dk-menu__group-label')!), bg, 4.5], ['delete', c(del), bg, 4.5]);
      first.focus();
      checks.push(['highlighted label', c(first), bgOf(first), 4.5], ['highlighted shortcut', c(first.querySelector('kbd')!), bgOf(first), 4.5], ['highlighted icon', c(first.querySelector('.dk-menu__icon')!), bgOf(first), 3]);
      del.focus();
      checks.push(['highlighted delete', c(del), bgOf(del), 4.5]);
      for (const [k, fg, back, min] of checks) { const r = contrast(fg, back); if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    still.remove();
    expect(low).toEqual([]);
  });

  test('pressed: an item held down fills with pressed, one step past the highlight', async () => {
    await render(<Actions chosen={[]} />);
    await userEvent.click(el('mb'));
    const item = menuOf('mb').querySelectorAll<HTMLElement>('[role="menuitem"]')[1];
    await press(item, () => expect.poll(() => getComputedStyle(item).backgroundColor).toBe(color('var(--pressed)')));
  });

  test('a Tooltip around the trigger: the button still gets aria-haspopup, opens the menu on click and keeps its own onClick and ref', async () => {
    const clicks: string[] = [], ref = React.createRef<HTMLButtonElement>();
    await render(<Menu trigger={<Tooltip content="More"><IconButton id="tb" ref={ref} icon="more_vert" label="More" noTitle onClick={() => clicks.push('own')} /></Tooltip>}>
      <MenuItem>Edit</MenuItem>
    </Menu>);
    const b = el('tb');
    expect([b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded'), ref.current]).toEqual(['menu', 'false', b]);
    expect(b.getAttribute('aria-describedby')).toBe(document.querySelector('[role="tooltip"]')!.id);
    await userEvent.click(b);
    await expect.poll(() => openMenu()).toBeTruthy();
    expect([b.getAttribute('aria-expanded'), b.getAttribute('aria-controls'), clicks]).toEqual(['true', openMenu()!.id, ['own']]);
    expect(openMenu()!.getAttribute('aria-labelledby')).toBe(b.id);
  });

});
