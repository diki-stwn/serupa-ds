import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, press, settle, withMotion, iconPoints, settled } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import { ContextMenu, keyShortcuts, Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuSub } from './Menu';
import { page } from 'vitest/browser';
import { useShortcut } from '../KeyboardShortcuts/KeyboardShortcuts';

const modded = (t: Element, key: string) => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });
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
  test('with Alt, Ctrl or ⌘ the arrows, Home and End are left to the browser, on the trigger and in the open menu (L8E36)', async () => {
    await render(<Menu trigger={<Button id="mmk">Actions</Button>}><MenuItem>Copy</MenuItem><MenuItem>Paste</MenuItem><MenuItem>Delete</MenuItem></Menu>);
    const t = el('mmk');
    t.focus();
    const trigger = [modded(t, 'ArrowDown'), modded(t, 'ArrowUp'), t.getAttribute('aria-expanded')];
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => (document.activeElement as HTMLElement).textContent).toBe('Copy');
    const first = document.activeElement as HTMLElement;
    expect([trigger, modded(first, 'ArrowDown'), modded(first, 'End'), document.activeElement === first]).toEqual([[[false, false, false], [false, false, false], 'false'], [false, false, false], [false, false, false], true]);
  });

  test('a letter typed to find an item doesn\'t also run a page shortcut on that letter (L8E42)', async () => {
    const ran: string[] = [];
    const Page = () => { useShortcut('g', () => ran.push('g')); return <Menu trigger={<Button id="mts">Actions</Button>}><MenuItem>Copy</MenuItem><MenuItem>Go to file</MenuItem></Menu>; };
    await render(<Page />);
    el('mts').focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => (document.activeElement as HTMLElement).textContent).toBe('Copy');
    await userEvent.keyboard('g');
    await expect.poll(() => (document.activeElement as HTMLElement).textContent).toBe('Go to file');
    expect(ran).toEqual([]);
  });

  test('the panel takes the other HTML attributes and a ref: id, data-testid, aria-describedby, and an onKeyDown that runs first (GJ2)', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const keys: string[] = [];
    await render(<><p id="hint">Hint</p><Menu ref={ref} id="acts" data-testid="acts-menu" aria-describedby="hint" onKeyDown={(e) => keys.push(e.key)} defaultOpen trigger={<Button id="mb">Actions</Button>}>
      <MenuItem>Edit</MenuItem><MenuItem>Delete</MenuItem>
    </Menu></>);
    const m = document.querySelector<HTMLElement>('[data-testid="acts-menu"]')!;
    expect(ref.current).toBe(m);
    expect(m.id).toBe('acts');
    expect(m.getAttribute('role')).toBe('menu');
    expect(el('mb').getAttribute('aria-controls')).toBe('acts');
    expect(m.getAttribute('aria-describedby')).toBe('hint');
    expect(m.getAttribute('aria-labelledby')).toBe('mb');
    await settle();
    await userEvent.keyboard('{ArrowDown}');
    expect(keys).toEqual(['ArrowDown']);
    expect(focus()).toBe('Delete');
  });
  test('MenuCheckboxItem, MenuRadioItem and MenuSub take data-* and a ref on their item too (GJ2)', async () => {
    const box = React.createRef<HTMLElement>(), radio = React.createRef<HTMLElement>(), sub = React.createRef<HTMLElement>();
    await render(<Menu defaultOpen trigger={<Button id="mgj">View</Button>}>
      <MenuCheckboxItem ref={box} data-testid="grid" checked onCheckedChange={() => {}}>Show grid</MenuCheckboxItem>
      <MenuRadioGroup value="a"><MenuRadioItem ref={radio} data-testid="sort-a" value="a">By name</MenuRadioItem></MenuRadioGroup>
      <MenuSub ref={sub} data-testid="more" label="More"><MenuItem>Archive</MenuItem></MenuSub>
    </Menu>);
    const q = (t: string) => document.querySelector<HTMLElement>(`[data-testid="${t}"]`);
    expect([box.current === q('grid'), q('grid')!.getAttribute('role'), radio.current === q('sort-a'), q('sort-a')!.getAttribute('role'), sub.current === q('more'), q('more')!.getAttribute('aria-haspopup')])
      .toEqual([true, 'menuitemcheckbox', true, 'menuitemradio', true, 'menu']);
  });
  test('an onSelect that moves focus itself keeps it there: a row\'s Delete that focuses the next row; one that doesn\'t sends focus back to the button (L8E21)', async () => {
    function Rows() {
      const [rows, setRows] = React.useState(['a', 'b']);
      return <>{rows.map((r, i) => <div key={r} id={'row-' + r} tabIndex={-1}>
        <Menu trigger={<Button id={'mb-' + r}>More</Button>}>
          <MenuItem onSelect={() => { el('row-' + rows[i + 1])?.focus(); setRows(rows.filter((x) => x !== r)); }}>Delete</MenuItem>
          <MenuItem>Rename</MenuItem>
        </Menu>
      </div>)}</>;
    }
    await render(<Rows />);
    await userEvent.click(el('mb-a'));
    await expect.poll(() => focus()).toBe('Delete');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => document.getElementById('row-a')).toBeNull();
    expect(document.activeElement!.id).toBe('row-b');
    await userEvent.click(el('mb-b'));
    await expect.poll(() => focus()).toBe('Delete');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.poll(() => openMenu()).toBeUndefined();
    expect(document.activeElement!.id).toBe('mb-b');
  });

  test('defaultOpen: open on arrival, uncontrolled; Escape closes it by itself and tells onOpenChange(false)', async () => {
    const asks: boolean[] = [];
    await render(<Menu defaultOpen onOpenChange={(v) => asks.push(v)} trigger={<Button id="mdef">Actions</Button>}><MenuItem>Edit</MenuItem></Menu>);
    await expect.poll(() => !menuOf('mdef').hidden).toBe(true);
    expect(el('mdef').getAttribute('aria-expanded')).toBe('true');
    menuOf('mdef').focus();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => openMenu()).toBe(undefined);
    expect([asks.join(), el('mdef').getAttribute('aria-expanded')]).toEqual(['false', 'false']);
  });

  test('onOpenChange says why: trigger, select, escape, blur (Tab), outside', async () => {
    const why: string[] = [];
    await render(<div><button id="mafter">After</button><Menu onOpenChange={(v, d) => why.push((v ? 'open ' : 'shut ') + d.reason)} trigger={<Button id="mwhy">Actions</Button>}><MenuItem>Edit</MenuItem></Menu></div>);
    const reopen = async () => { await userEvent.click(el('mwhy')); await expect.poll(() => !!openMenu()).toBe(true); };
    await reopen();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => openMenu()).toBe(undefined);
    await reopen();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => openMenu()).toBe(undefined);
    await reopen();
    await userEvent.keyboard('{Tab}');
    await expect.poll(() => openMenu()).toBe(undefined);
    await reopen();
    await userEvent.click(el('mafter'));
    await expect.poll(() => openMenu()).toBe(undefined);
    expect(why).toEqual(['open trigger', 'shut select', 'open trigger', 'shut escape', 'open trigger', 'shut blur', 'open trigger', 'shut outside']);
  });

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

  test('a mouse opens it on the press: drag onto an item and let go chooses it; a quick click leaves it open; a press on the open button closes it (GG3)', async () => {
    const chosen: string[] = [];
    await render(<Actions chosen={chosen} />);
    const b = el('mb');
    await press(b, async () => {
      await expect.poll(() => b.getAttribute('aria-expanded')).toBe('true');
      expect(focus()).toBe('Edit');
      await new Promise((r) => setTimeout(r, 250));
      await userEvent.hover(menuOf('mb').querySelectorAll('[role="menuitem"]')[1]);
    });
    await expect.poll(() => chosen).toEqual(['dup']);
    expect([b.getAttribute('aria-expanded'), document.activeElement]).toEqual(['false', b]);
    await userEvent.click(b);
    await expect.poll(() => focus()).toBe('Edit');
    expect([b.getAttribute('aria-expanded'), chosen]).toEqual(['true', ['dup']]);
    await press(b, () => expect.poll(() => b.getAttribute('aria-expanded')).toBe('false'));
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => focus()).toBe('Edit');
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

  test('a Space typed within a word is part of it ("save a" finds "Save as…"), not a choice, on an item or a MenuSub; after a pause Space chooses (GQ4)', async () => {
    const chosen: string[] = [];
    await render(<Menu trigger={<Button id="mb">File</Button>}>
      <MenuSub id="sto" label="Save to"><MenuItem onSelect={() => chosen.push('drive')}>Drive</MenuItem></MenuSub>
      <MenuItem onSelect={() => chosen.push('save')}>Save</MenuItem>
      <MenuItem onSelect={() => chosen.push('saveas')}>Save as…</MenuItem>
      <MenuItem onSelect={() => chosen.push('settings')}>Settings</MenuItem>
    </Menu>);
    await userEvent.click(el('mb'));
    await expect.poll(() => document.activeElement?.id).toBe('sto');
    await userEvent.keyboard('save ');   // on "Save to", a submenu: the space doesn't open it
    expect(el('sto').getAttribute('aria-expanded')).toBe('false');
    await userEvent.keyboard('a');
    expect(focus()).toBe('Save as…');
    expect(chosen).toEqual([]);
    await new Promise((r) => setTimeout(r, 600));
    await userEvent.keyboard(' ');
    expect(chosen).toEqual(['saveas']);
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
    await expect.poll(() => !!openMenu()).toBe(false);
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

  test('Space on a link item follows it, as Enter does: runs onSelect, closes the menu and goes there (L8E66)', async () => {
    const chosen: string[] = [];
    await render(<Actions chosen={chosen} />);
    await userEvent.click(el('mb'));
    el('lnk').focus();
    await userEvent.keyboard(' ');
    await expect.poll(() => location.hash).toBe('#share');
    expect([chosen.join(), !!openMenu()]).toEqual(['share', false]);
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('aria-label names the menu; bottom-end lines up the ends; onSelect with preventDefault keeps it open', async () => {
    const chosen: string[] = [];
    await render(<div style={{ paddingLeft: '300px' }}><Menu trigger={<IconButton id="ib" icon="more_vert" label="More" />} placement="bottom-end" aria-label="Row actions">
      <MenuItem onSelect={(e) => { e.preventDefault(); chosen.push('stay'); }}>Stay open</MenuItem><MenuItem>Two</MenuItem>
    </Menu></div>);
    await userEvent.click(el('ib'));
    await expect.poll(() => !!menuOf('ib') && near(rect(menuOf('ib')).right, rect(el('ib')).right)).toBe(true);
    const m = menuOf('ib');
    expect([m.getAttribute('aria-label'), m.getAttribute('aria-labelledby')]).toEqual(['Row actions', null]);
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
    await expect.poll(() => menuOf('cb') && getComputedStyle(menuOf('cb')).backgroundColor).toBe('rgb(1, 2, 3)');
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

  test('MenuSub at 320px: with no room on either side, both submenu levels stay on screen and the page doesn\'t scroll sideways (RF1)', async () => {
    await page.viewport(320, 640);
    try {
      await render(<Menu trigger={<Button id="nb">File</Button>}>
        <MenuSub id="share" icon="share" label="Share"><MenuItem>Email</MenuItem><MenuSub id="more" label="More apps"><MenuItem>Chat</MenuItem></MenuSub></MenuSub>
      </Menu>);
      await userEvent.click(el('nb'));
      await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{ArrowRight}');
      await settle();
      const panels = [sub('share')!, sub('more')!];
      expect([focus(), ...panels.map((p) => rect(p).left >= -1 && rect(p).right <= 321), document.documentElement.scrollWidth <= 320]).toEqual(['Chat', true, true, true]);
    } finally { await page.viewport(900, 700); }
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
    expect(iconPoints(item.querySelector('.dk-menu__chevron [data-icon]')!)).toBe('left');
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
    expect(getComputedStyle(it.querySelector('[data-icon]')!).fontSize).toBe('16px');
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

  test('keyShortcuts: a last + or - is the key ("Ctrl++" is Control+Plus), hyphens separate ("Cmd-K"), "G then I" is two presses (CE1)', () => {
    expect(['Ctrl++', 'Ctrl+-', '⌘+', '+', 'Cmd-K', 'Ctrl-S', 'ctrl - shift - p', 'G then I', 'Ctrl+K then Ctrl+S', 'Shift+Plus'].map(keyShortcuts))
      .toEqual(['Control+Plus', 'Control+-', 'Meta+Plus', 'Plus', 'Meta+K', 'Control+S', 'Control+Shift+P', 'G I', 'Control+K Control+S', 'Shift+Plus']);
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
    await render(<Menu trigger={<Tooltip content="More"><IconButton id="tb" ref={ref} icon="more_vert" label="More" hideTitle onClick={() => clicks.push('own')} /></Tooltip>}>
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

  test('your onClick and onKeyDown run first, on the button, the items and a submenu, and preventDefault stops the menu; a menu with no items takes focus itself', async () => {
    const calls: string[] = [];
    const stop = (n: string) => (e: React.SyntheticEvent) => { calls.push(n); e.preventDefault(); };
    const note = (n: string) => () => { calls.push(n); };
    await render(<div>
      <Menu trigger={<Button id="sb" onClick={stop('btn-click')} onKeyDown={stop('btn-key')}>Stopped</Button>}><MenuItem>One</MenuItem></Menu>
      <Menu trigger={<Button id="hb">Handlers</Button>}>
        <MenuItem id="it" onClick={note('it-click')} onKeyDown={stop('it-key')} onSelect={note('it-select')}>Item</MenuItem>
        <MenuSub id="sub" label="More" onClick={stop('sub-click')} onKeyDown={stop('sub-key')}><MenuItem>Inner</MenuItem></MenuSub>
      </Menu>
      <Menu trigger={<Button id="eb">Empty</Button>}>{null}</Menu>
    </div>);
    await userEvent.click(el('sb'));
    el('sb').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect([el('sb').getAttribute('aria-expanded'), calls.join()]).toEqual(['false', 'btn-click,btn-key']);
    calls.length = 0;
    await userEvent.click(el('hb'));
    await expect.poll(() => focus()).toBe('Item');
    await userEvent.keyboard('{Enter}');
    expect([el('hb').getAttribute('aria-expanded'), calls.join()]).toEqual(['true', 'it-key']);
    el('sub').focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.click(el('sub'));
    expect(el('sub').getAttribute('aria-expanded')).toBe('false');
    expect(calls).toEqual(expect.arrayContaining(['sub-key', 'sub-click']));
    await userEvent.click(el('it'));
    expect(calls).toEqual(expect.arrayContaining(['it-click', 'it-select']));
    await expect.poll(() => el('hb').getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(el('eb'));
    await expect.poll(() => document.activeElement).toBe(menuOf('eb'));
  });

  test('MenuCheckboxItem: role menuitemcheckbox with aria-checked and a check before the label while on; choosing flips it, tells onCheckedChange and closes the menu; ↓ reaches it; the state is the parent\'s (checked), so one the parent doesn\'t change stays', async () => {
    const asks: boolean[] = [];
    function View() {
      const [grid, setGrid] = React.useState(false), [rulers, setRulers] = React.useState(true);
      return <Menu trigger={<Button id="vb">View</Button>}>
        <MenuItem>Zoom in</MenuItem>
        <MenuCheckboxItem checked={grid} onCheckedChange={(v) => { asks.push(v); setGrid(v); }}>Show grid</MenuCheckboxItem>
        <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers} shortcut="⌘R">Rulers</MenuCheckboxItem>
        <MenuCheckboxItem checked={false} onSelect={(e) => e.preventDefault()}>Locked</MenuCheckboxItem>
      </Menu>;
    }
    await render(<View />);
    const items = () => [...menuOf('vb').querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    const state = () => items().map((x) => x.getAttribute('role')!.replace('menuitem', '') + ':' + x.getAttribute('aria-checked'));
    const ticks = () => items().map((x) => { const c = x.querySelector('[data-icon="check"]'); return c ? getComputedStyle(c).visibility : '-'; });
    await userEvent.click(el('vb'));
    expect(state()).toEqual([':null', 'checkbox:false', 'checkbox:true', 'checkbox:false']);
    expect(ticks()).toEqual(['-', 'hidden', 'visible', 'hidden']);
    expect(items()[2].getAttribute('aria-keyshortcuts')).toBe('Meta+R');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement!.textContent).toBe('Show grid');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => openMenu()).toBe(undefined);
    expect(asks).toEqual([true]);
    await userEvent.click(el('vb'));
    expect(state()).toEqual([':null', 'checkbox:true', 'checkbox:true', 'checkbox:false']);
    await userEvent.click(items()[2]);
    await userEvent.click(el('vb'));
    expect(state()[2]).toBe('checkbox:false');
    await userEvent.click(items()[3]);
    expect([!!openMenu(), state()[3]]).toEqual([true, 'checkbox:false']);
  });

  test('MenuRadioGroup: a group named by its label, MenuRadioItems with role menuitemradio and aria-checked on the chosen one; choosing one tells onValueChange and moves the check', async () => {
    const asks: string[] = [];
    function Sort() {
      const [by, setBy] = React.useState('name');
      return <Menu trigger={<Button id="sb">Sort</Button>}>
        <MenuRadioGroup label="Sort by" value={by} onValueChange={(v) => { asks.push(v); setBy(v); }}>
          <MenuRadioItem value="name">Name</MenuRadioItem>
          <MenuRadioItem value="date">Date</MenuRadioItem>
          <MenuRadioItem value="size" disabled>Size</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>;
    }
    await render(<Sort />);
    const radios = () => [...menuOf('sb').querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    await userEvent.click(el('sb'));
    const g = menuOf('sb').querySelector('[role="group"]')!;
    expect(document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent).toBe('Sort by');
    expect(radios().map((x) => x.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(document.activeElement!.textContent).toBe('Name');
    await userEvent.click(radios()[1]);
    await userEvent.click(el('sb'));
    expect(radios().map((x) => x.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    radios()[2].click();
    expect([asks, radios()[2].getAttribute('aria-checked')]).toEqual([['date'], 'false']);
  });

  test('L8E80: an item hidden by CSS or the hidden attribute is skipped by the arrows, Home, End and on open, so focus never sticks', async () => {
    await render(<Menu trigger={<Button id="hb">More</Button>}>
      <MenuItem hidden>Gone first</MenuItem>
      <MenuItem>One</MenuItem>
      <MenuItem style={{ display: 'none' }}>Gone</MenuItem>
      <MenuItem>Two</MenuItem>
      <MenuItem hidden>Gone last</MenuItem>
    </Menu>);
    await userEvent.click(el('hb'));
    const seen = [focus()];
    for (const k of ['{ArrowDown}', '{ArrowDown}', '{ArrowUp}', '{End}', '{Home}', '{ArrowUp}']) { await userEvent.keyboard(k); seen.push(focus()); }
    expect(seen).toEqual(['One', 'Two', 'One', 'Two', 'Two', 'One', 'Two']);
  });
});

describe('ContextMenu', () => {
  function Area({ chosen, ...p }: { chosen: string[]; disabled?: boolean; onOpenChange?: (open: boolean, d: { reason: string }) => void }) {
    return <>
      <button id="before">Before</button>
      <ContextMenu aria-label="File actions" {...p} target={<div id="area" tabIndex={0} style={{ width: '300px', height: '200px', margin: '40px' }}>Report.pdf</div>}>
        <MenuItem onSelect={() => chosen.push('open')}>Open</MenuItem>
        <MenuItem onSelect={() => chosen.push('rename')}>Rename</MenuItem>
        <MenuItem destructive onSelect={() => chosen.push('delete')}>Delete</MenuItem>
      </ContextMenu>
    </>;
  }

  test('the panel takes the other HTML attributes and a ref: id, data-testid, aria-describedby, and an onKeyDown that runs first (GJ2)', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const keys: string[] = [];
    await render(<><p id="hint">Hint</p><ContextMenu ref={ref} id="file-acts" data-testid="file-menu" aria-label="File actions" aria-describedby="hint" onKeyDown={(e) => keys.push(e.key)}
      target={<div id="area" tabIndex={0}>Report.pdf</div>}>
      <MenuItem>Open</MenuItem><MenuItem>Rename</MenuItem>
    </ContextMenu></>);
    const r = rect(el('area'));
    el('area').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5, button: 2 }));
    const m = document.querySelector<HTMLElement>('[data-testid="file-menu"]')!;
    expect([ref.current === m, m.id, m.getAttribute('role'), m.getAttribute('aria-describedby')]).toEqual([true, 'file-acts', 'menu', 'hint']);
    await expect.poll(() => focus()).toBe('Open');
    await userEvent.keyboard('{ArrowDown}');
    expect([keys, focus()]).toEqual([['ArrowDown'], 'Rename']);
  });

  test('a right-click opens a role="menu" named by aria-label at the pointer, focus on the first item; the browser\'s menu is kept away', async () => {
    await render(<Area chosen={[]} />);
    const r = rect(el('area'));
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 50, clientY: r.top + 60, button: 2 });
    el('area').dispatchEvent(ev);
    await expect.poll(() => focus()).toBe('Open');
    const m = openMenu()!;
    expect([ev.defaultPrevented, m.getAttribute('aria-label'), focus()]).toEqual([true, 'File actions', 'Open']);
    const mr = rect(m);
    expect(near(mr.left, r.left + 50) && mr.top >= r.top + 60 && mr.top <= r.top + 60 + 8).toBe(true);
  });

  test('Shift+F10 or the Menu key on the focused area opens it at the area\'s lower corner; Escape closes it and focus goes back', async () => {
    await render(<Area chosen={[]} />);
    el('area').focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await expect.poll(() => [!!openMenu(), focus()]).toEqual([true, 'Open']);
    expect(near(rect(openMenu()!).left, rect(el('area')).left)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => [openMenu(), document.activeElement!.id]).toEqual([undefined, 'area']);
    await userEvent.keyboard('{ContextMenu}');
    await expect.poll(() => focus()).toBe('Open');
  });

  test('Menu\'s keys work in it; choosing an item runs onSelect, closes it and puts focus back; a click outside closes it', async () => {
    const chosen: string[] = [];
    await render(<Area chosen={chosen} />);
    el('area').focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await expect.poll(() => focus()).toBe('Open');
    await userEvent.keyboard('{ArrowDown}');
    expect(focus()).toBe('Rename');
    await userEvent.keyboard('d');
    expect(focus()).toBe('Delete');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => [chosen.join(), openMenu(), document.activeElement!.id]).toEqual(['delete', undefined, 'area']);
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await expect.poll(() => !!openMenu()).toBe(true);
    await userEvent.click(el('before'));
    await expect.poll(() => openMenu()).toBeUndefined();
  });

  test('ContextMenu onOpenChange says why: trigger (right-click or keys), select, escape, outside', async () => {
    const why: string[] = [];
    await render(<Area chosen={[]} onOpenChange={(v, d) => why.push((v ? 'open ' : 'shut ') + d.reason)} />);
    const keysOpen = async () => { el('area').focus(); await userEvent.keyboard('{Shift>}{F10}{/Shift}'); await expect.poll(() => !!openMenu()).toBe(true); };
    await keysOpen();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => openMenu()).toBe(undefined);
    await keysOpen();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => openMenu()).toBe(undefined);
    await keysOpen();
    await userEvent.click(el('before'));
    await expect.poll(() => openMenu()).toBe(undefined);
    expect(why).toEqual(['open trigger', 'shut select', 'open trigger', 'shut escape', 'open trigger', 'shut outside']);
  });

  test('disabled: the browser keeps its own menu and the keys do nothing; the target\'s own onContextMenu runs first and can stop it', async () => {
    await render(<Area chosen={[]} disabled />);
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 60 });
    el('area').dispatchEvent(ev);
    el('area').focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await settle();
    expect([ev.defaultPrevented, openMenu()]).toEqual([false, undefined]);
    const seen: string[] = [];
    await render(<ContextMenu aria-label="Own" target={<div id="own" onContextMenu={(e) => { seen.push('own'); e.preventDefault(); }}>Own</div>}><MenuItem>One</MenuItem></ContextMenu>);
    el('own').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    await settle();
    expect([seen.join(), openMenu()]).toEqual(['own', undefined]);
  });

  test('the menu scales in from the point on its edge facing the trigger, level with the trigger\'s centre (EO1)', async () => {
    await render(<div style={{ padding: '40px 120px' }}><Menu trigger={<Button id="mo">Actions</Button>}><MenuItem>Edit</MenuItem><MenuItem>Duplicate</MenuItem></Menu></div>);
    await userEvent.click(el('mo'));
    const m = document.querySelector('[role=menu]') as HTMLElement, b = el('mo').getBoundingClientRect(), r = m.getBoundingClientRect();
    const [x, y] = getComputedStyle(m).transformOrigin.split(' ').map(parseFloat);
    expect([m.dataset.side, Math.round(y), Math.abs(r.left + x - (b.left + b.width / 2)) <= 1]).toEqual(['bottom', 0, true]);
  });
});

describe('Menu: motion (DZ1)', () => {
  const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
  const runs = (e: Element) => e.getAnimations().filter((a) => a instanceof CSSTransition && /^(opacity|scale)$/.test(a.transitionProperty)).map((a) => [(a as CSSTransition).transitionProperty, ms(a)]).sort();
  // Kept in the top layer while it fades only where overlay can be held (Chromium); elsewhere it closes at once.
  const holds = () => CSS.supports('overlay', 'auto');
  test('opens with a transition and fades and shrinks out faster, its items kept (inert) until the fade ends; focus is back at once', async () => {
    await withMotion(async () => {
      await render(<Actions chosen={[]} />);
      await userEvent.click(el('mb'));
      const m = menuOf('mb');
      expect([runs(m), m.getAnimations().some((a) => a instanceof CSSAnimation)]).toEqual([[['opacity', 150], ['scale', 150]], false]);
      await settled(m, { subtree: true });
      expect([getComputedStyle(m).opacity, getComputedStyle(m).scale]).toEqual(['1', 'none']);
      await userEvent.click(el('mb'));
      expect([openMenu(), document.activeElement]).toEqual([undefined, el('mb')]);
      if (!holds()) { expect(getComputedStyle(m).display).toBe('none'); return; }
      expect([getComputedStyle(m).display, m.inert, m.querySelectorAll('[role="menuitem"]').length, runs(m)]).toEqual(['block', true, 5, [['opacity', 100], ['scale', 100]]]);
      await settled(m, { subtree: true });
      await expect.poll(() => m.querySelectorAll('[role="menuitem"]').length).toBe(0);
      expect(getComputedStyle(m).display).toBe('none');
    });
  });

  test('opening, the items arrive with the menu as one: no item waits or moves on its own', async () => {
    await withMotion(async () => {
      await render(<Actions chosen={[]} />);
      await userEvent.click(el('mb'));
      const m = menuOf('mb'), items = [...m.querySelectorAll('[role="menuitem"]')];
      const moves = (e: Element) => e.getAnimations().map((a) => (a as CSSTransition).transitionProperty).filter((p) => p === 'opacity' || p === 'translate');
      expect(items.flatMap(moves)).toEqual([]);
      expect(items.map((i) => getComputedStyle(i).transitionDelay)).toEqual(items.map(() => '0s'));
      await settled(m, { subtree: true });
      expect(items.map((i) => getComputedStyle(i).opacity)).toEqual(['1', '1', '0.5', '1', '1']);   // Archive is disabled
    });
  });

  test('a submenu open when its item is chosen fades out with its menu; one open on arrival is there from the first frame; ContextMenu fades out too', async () => {
    await withMotion(async () => {
      await render(<Nested chosen={[]} />);
      await userEvent.click(el('nb'));
      await userEvent.click(el('share'));
      const s = sub('share')!;
      await expect.poll(() => s.hidden).toBe(false);
      expect(el('share').getAttribute('aria-expanded')).toBe('true');
      const m = menuOf('nb');
      await settled(m, { subtree: true });
      await userEvent.click(page.getByRole('menuitem', { name: 'Email' }));
      expect([openMenu(), s.hidden]).toEqual([undefined, true]);
      if (holds()) {
        expect([runs(m), runs(s), getComputedStyle(s).display]).toEqual([[['opacity', 100], ['scale', 100]], [['opacity', 100], ['scale', 100]], 'block']);
        await settled(m, { subtree: true });
      }
      await expect.poll(() => m.querySelectorAll('[role="menuitem"]').length).toBe(0);

      await render(<Menu defaultOpen trigger={<Button id="marr">Actions</Button>}><MenuItem>Edit</MenuItem></Menu>);
      await expect.poll(() => !menuOf('marr').hidden).toBe(true);
      expect([menuOf('marr').getAnimations().length, getComputedStyle(menuOf('marr')).opacity]).toEqual([0, '1']);

      await render(<ContextMenu aria-label="Card actions" target={<div id="ctx" style={{ width: 200, height: 100 }}>Card</div>}><MenuItem>Rename</MenuItem></ContextMenu>);
      await userEvent.click(el('ctx'), { button: 'right' });
      const c = openMenu()!;
      await settled(c, { subtree: true });
      await userEvent.click(el('ctx'), { position: { x: 4, y: 4 } });
      expect(c.hidden).toBe(true);
      if (holds()) expect([c.inert, runs(c), c.querySelectorAll('[role="menuitem"]').length]).toEqual([true, [['opacity', 100], ['scale', 100]], 1]);
    });
  });

  test('from the keyboard (KW1): opened by Enter, a submenu by ArrowRight, both are there at once; Escape takes each away at once', async () => {
    await withMotion(async () => {
      await render(<Nested chosen={[]} />);
      el('nb').focus();
      await userEvent.keyboard('{Enter}');
      const m = menuOf('nb');
      expect([m.hidden, m.getAnimations().length, getComputedStyle(m).opacity]).toEqual([false, 0, '1']);
      el('share').focus();
      await userEvent.keyboard('{ArrowRight}');
      const s = sub('share')!;
      await expect.poll(() => s.hidden).toBe(false);
      expect([s.getAnimations().length, getComputedStyle(s).opacity]).toEqual([0, '1']);
      await userEvent.keyboard('{Escape}');
      expect([s.hidden, getComputedStyle(s).display, s.getAnimations().length, m.hidden]).toEqual([true, 'none', 0, false]);
      await userEvent.keyboard('{Escape}');
      expect([m.hidden, getComputedStyle(m).display, m.getAnimations().length, m.querySelectorAll('[role="menuitem"]').length]).toEqual([true, 'none', 0, 0]);
    });
  });

  test('L8E104: the <dialog> it sits in closing closes it, so it is not open again when the dialog reopens', async () => {
    await render(<dialog id="l8e104d"><Menu trigger={<Button id="l8e104t">Actions</Button>}><MenuItem>Rename</MenuItem></Menu></dialog>);
    const d = document.getElementById('l8e104d') as HTMLDialogElement;
    d.showModal();
    await userEvent.click(document.getElementById('l8e104t')!);
    d.close();
    // The close event comes in a task after close().
    await new Promise((r) => setTimeout(r, 50));
    d.showModal();
    expect([document.getElementById('l8e104t')!.getAttribute('aria-expanded'), document.querySelectorAll('[role="menu"]:popover-open').length]).toEqual(['false', 0]);
    d.close();
  });
});
