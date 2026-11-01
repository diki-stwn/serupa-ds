import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, drag, withMotion } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { SortableList } from './SortableList';

type Item = { id: string; name: string };
const ITEMS: Item[] = ['Apollo', 'Gemini', 'Mercury', 'Artemis'].map((name) => ({ id: name.toLowerCase(), name }));
const names = () => [...document.querySelectorAll('#sl .dk-sortable-list__content')].map((n) => n.textContent);
const handle = (name: string) => document.querySelector(`#sl button[aria-label$=" ${name}"]`) as HTMLButtonElement;
const announcer = () => document.querySelector<HTMLElement>('[data-dk-announcer]');
const said = (text: string | RegExp) => expect.poll(() => announcer()?.textContent || '', { timeout: 3000 }).toMatch(text);

function List({ moves, disabled }: { moves?: Array<{ from: number; to: number }>; disabled?: boolean }) {
  const [items, setItems] = React.useState(ITEMS);
  return <div style={{ width: '320px' }}><SortableList id="sl" aria-label="Missions" items={items} getKey={(i) => i.id} getLabel={(i) => i.name} disabled={disabled}
    renderItem={(i, s) => <span data-index={s.index} data-dragging={s.dragging || undefined}>{i.name}</span>}
    onReorder={(next, m) => { moves?.push(m); setItems(next); }} /><button id="after">After</button></div>;
}

describe('SortableList', () => {
  test('a <ul> of <li> rows, each with a handle named "Reorder <name>", described by the instructions; renderItem gets the index; ref and props reach the <ul>', async () => {
    const ref = React.createRef<HTMLUListElement>();
    await render(<SortableList ref={ref} id="sl" className="extra" aria-label="Missions" items={ITEMS} getKey={(i) => i.id} getLabel={(i) => i.name}
      renderItem={(i, s) => `${s.index}:${i.name}`} onReorder={() => undefined} />);
    const ul = document.getElementById('sl')!, h = handle('Apollo');
    expect([ul.tagName, ref.current === ul, ul.className, ul.getAttribute('aria-label'), ul.dataset.component, ul.children.length, names()])
      .toEqual(['UL', true, 'dk-sortable-list extra', 'Missions', 'sortable-list', 4, ['0:Apollo', '1:Gemini', '2:Mercury', '3:Artemis']]);
    expect([h.getAttribute('type'), h.getAttribute('aria-pressed'), document.getElementById(h.getAttribute('aria-describedby')!)!.textContent])
      .toEqual(['button', 'false', 'Press Space to pick it up, the arrow keys to move it, Space again to drop it, or Escape to cancel.']);
  });

  test('a long single word wraps inside its row, so a narrow list never makes the page scroll sideways (RF1, WCAG 1.4.10)', async () => {
    await render(<div style={{ width: '220px' }}><SortableList id="lw" aria-label="Tasks" items={[{ id: 'a', name: 'Donaudampfschifffahrtsgesellschaftskapitänskajüte' }]} getKey={(i) => i.id} getLabel={(i) => i.name} onReorder={() => undefined} renderItem={(i) => i.name} /></div>);
    const li = document.querySelector('#lw li')!, row = li.getBoundingClientRect();
    const r = document.createRange(); r.selectNodeContents(li.lastElementChild!);
    expect([Math.round(row.width), r.getBoundingClientRect().right <= row.right]).toEqual([220, true]);
  });

  test('without items (a plain-JS caller) it renders an empty list instead of throwing', async () => {
    const Loose = SortableList as unknown as React.ComponentType<Record<string, unknown>>;
    const screen = await render(<Loose id="noitems" getKey={(s: string) => s} getLabel={(s: string) => s} renderItem={(s: string) => s} onReorder={() => {}} />);
    expect(screen.container.querySelector('#noitems')!.querySelectorAll('li').length).toBe(0);
  });

  test('keyboard: Space picks up, the arrows move (focus stays on the handle), Space drops and reports the move once; each step is announced', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    handle('Gemini').focus();
    await userEvent.keyboard(' ');
    expect(handle('Gemini').getAttribute('aria-pressed')).toBe('true');
    await said('Picked up Gemini, position 2 of 4.');
    await userEvent.keyboard('{ArrowDown}');
    await said('Gemini, position 3 of 4.');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect([names(), document.activeElement === handle('Gemini'), moves]).toEqual([['Apollo', 'Mercury', 'Artemis', 'Gemini'], true, []]);
    await userEvent.keyboard(' ');
    await said('Dropped Gemini at position 4 of 4.');
    expect([names(), moves, handle('Gemini').getAttribute('aria-pressed'), document.activeElement === handle('Gemini')])
      .toEqual([['Apollo', 'Mercury', 'Artemis', 'Gemini'], [{ from: 1, to: 3 }], 'false', true]);
  });

  test('keyboard table: ArrowRight moves the picked-up row down a place, ArrowLeft and ArrowUp up one (FH1)', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    handle('Gemini').focus();
    await userEvent.keyboard(' {ArrowRight}{ArrowRight}');
    await said('Gemini, position 4 of 4.');
    await userEvent.keyboard('{ArrowLeft}');
    await said('Gemini, position 3 of 4.');
    await userEvent.keyboard('{ArrowUp}{ArrowUp} ');
    expect([names(), moves]).toEqual([['Gemini', 'Apollo', 'Mercury', 'Artemis'], [{ from: 1, to: 0 }]]);
  });

  test('Enter works like Space; Home and End move to the ends; Escape puts it back without reporting a move', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    handle('Mercury').focus();
    await userEvent.keyboard('{Enter}{Home}');
    expect(names()).toEqual(['Mercury', 'Apollo', 'Gemini', 'Artemis']);
    await userEvent.keyboard('{End}');
    expect(names()).toEqual(['Apollo', 'Gemini', 'Artemis', 'Mercury']);
    await userEvent.keyboard('{Escape}');
    await said('Cancelled. Mercury is back at position 3 of 4.');
    expect([names(), moves, document.activeElement === handle('Mercury')]).toEqual([['Apollo', 'Gemini', 'Mercury', 'Artemis'], [], true]);
    await userEvent.keyboard('{Enter}{Home}{Enter}');
    expect([names(), moves]).toEqual([['Mercury', 'Apollo', 'Gemini', 'Artemis'], [{ from: 2, to: 0 }]]);
  });

  test('Tab or a click elsewhere while an item is picked up puts it back', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    handle('Apollo').focus();
    await userEvent.keyboard(' {ArrowDown}');
    await userEvent.tab();
    expect([names(), moves, handle('Apollo').getAttribute('aria-pressed')]).toEqual([['Apollo', 'Gemini', 'Mercury', 'Artemis'], [], 'false']);
    handle('Apollo').focus();
    await userEvent.keyboard(' {ArrowDown}');
    await userEvent.click(document.getElementById('after')!);
    await expect.poll(() => names()).toEqual(['Apollo', 'Gemini', 'Mercury', 'Artemis']);
    expect(moves).toEqual([]);
  });

  test('pointer: dragging a handle moves the row under the pointer, the others make room, and dropping reports the move', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    const rows = [...document.querySelectorAll('#sl > li')] as HTMLElement[];
    const step = rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top;
    const h = handle('Apollo'), c = { x: h.offsetWidth / 2, y: h.offsetHeight / 2 };
    await drag(h, c, { x: c.x, y: c.y + step * 2 + 4 }, 8);
    expect([names(), moves]).toEqual([['Gemini', 'Mercury', 'Apollo', 'Artemis'], [{ from: 0, to: 2 }]]);
    await said('Dropped Apollo at position 3 of 4.');
    expect(([...document.querySelectorAll('#sl > li')] as HTMLElement[]).map((r) => r.style.transform)).toEqual(['', '', '', '']);
  });

  test('pointer: let go right after a move (before it renders), the row drops where the pointer is', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    const h = handle('Apollo'), r = h.getBoundingClientRect(), last = handle('Artemis').getBoundingClientRect();
    const at = (type: string, y: number, target: EventTarget = window) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 8, button: 0, isPrimary: true, clientX: r.left + 4, clientY: y }));
    at('pointerdown', r.top + 4, h);
    at('pointermove', r.top + 20);
    at('pointermove', last.bottom);
    at('pointerup', last.bottom);
    await expect.poll(() => names()).toEqual(['Gemini', 'Mercury', 'Artemis', 'Apollo']);
    expect(moves).toEqual([{ from: 0, to: 3 }]);
  });

  test('pointer: held near the bottom of a scrolling container, the list scrolls and the row keeps moving down; near the top it scrolls back', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: 'm' + i, name: 'Mission ' + i }));
    const moves: Array<{ from: number; to: number }> = [];
    await render(<div id="box" style={{ width: '320px', height: '200px', overflowY: 'auto' }}><SortableList id="sl" aria-label="Missions" items={many} getKey={(i) => i.id} getLabel={(i) => i.name}
      onReorder={(_next, m) => { moves.push(m); }} renderItem={(i) => <span>{i.name}</span>} /></div>);
    const box = document.getElementById('box')!, h = handle('Mission 0'), r = h.getBoundingClientRect(), b = box.getBoundingClientRect();
    const at = (type: string, y: number, target: EventTarget = window) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, button: 0, isPrimary: true, clientX: r.left + 4, clientY: y }));
    at('pointerdown', r.top + 4, h);
    at('pointermove', r.top + 20);
    at('pointermove', b.bottom - 4);
    await expect.poll(() => box.scrollTop, { timeout: 3000 }).toBeGreaterThan(150);
    at('pointermove', b.top + 4);
    const down = box.scrollTop;
    await expect.poll(() => box.scrollTop).toBeLessThan(down);
    at('pointermove', b.bottom - 60);
    at('pointerup', b.bottom - 60);
    expect(moves.length === 1 && moves[0].from === 0 && moves[0].to > 0).toBe(true);
  });

  test('a press without moving picks the row up (2.5.7, FG1); a press on another row\'s handle drops it in that row\'s place, on its own handle where it is; each is announced', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    await userEvent.click(handle('Apollo'));
    await said('Picked up Apollo, position 1 of 4.');
    expect([handle('Apollo').getAttribute('aria-pressed'), document.activeElement === handle('Apollo')]).toEqual(['true', true]);
    await userEvent.click(handle('Mercury'));
    await said('Dropped Apollo at position 3 of 4.');
    expect([names(), moves, handle('Apollo').getAttribute('aria-pressed')]).toEqual([['Gemini', 'Mercury', 'Apollo', 'Artemis'], [{ from: 0, to: 2 }], 'false']);
    await userEvent.click(handle('Artemis'));
    await userEvent.click(handle('Artemis'));
    await said('Dropped Artemis at position 4 of 4.');
    expect([names(), moves.length]).toEqual([['Gemini', 'Mercury', 'Apollo', 'Artemis'], 1]);
  });

  test('a slow press on another row\'s handle still drops there: focus moving to it on the press doesn\'t cancel first', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    await userEvent.click(handle('Apollo'));
    await said('Picked up Apollo, position 1 of 4.');
    await userEvent.click(handle('Mercury'), { delay: 150 });
    await said('Dropped Apollo at position 3 of 4.');
    expect([names(), moves]).toEqual([['Gemini', 'Mercury', 'Apollo', 'Artemis'], [{ from: 0, to: 2 }]]);
  });

  test('a drag back to where it started reports nothing, and the press that ends a drag doesn\'t pick the row up', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<List moves={moves} />);
    const h = handle('Gemini'), c = { x: h.offsetWidth / 2, y: h.offsetHeight / 2 };
    await drag(h, c, { x: c.x, y: c.y + 6 }, 4);
    expect([names(), moves, handle('Gemini').getAttribute('aria-pressed')]).toEqual([['Apollo', 'Gemini', 'Mercury', 'Artemis'], [], 'false']);
  });

  test('horizontal: the items run in a row; a sideways drag moves one along it and drops it there', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<SortableList id="sl" aria-label="Missions" orientation="horizontal" items={ITEMS} getKey={(i) => i.id} getLabel={(i) => i.name}
      renderItem={(i) => i.name} onReorder={(_n, m) => { moves.push(m); }} />);
    const rows = [...document.querySelectorAll('#sl > li')] as HTMLElement[], [a, b] = rows.map((r) => r.getBoundingClientRect());
    expect([document.getElementById('sl')!.dataset.orientation, a.top === b.top, b.left > a.right]).toEqual(['horizontal', true, true]);
    const h = handle('Apollo'), r = h.getBoundingClientRect(), third = rows[2].getBoundingClientRect();
    const at = (type: string, x: number, target: EventTarget = window) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, button: 0, isPrimary: true, clientX: x, clientY: r.top + 4 }));
    at('pointerdown', r.left + 4, h);
    at('pointermove', r.left + 20);
    at('pointermove', third.right - 4);
    await expect.poll(() => names()).toEqual(['Gemini', 'Mercury', 'Apollo', 'Artemis']);
    expect(rows[0].style.transform).toMatch(/^translateX\(/);
    at('pointerup', third.right - 4);
    await expect.poll(() => moves).toEqual([{ from: 0, to: 2 }]);
  });

  test('horizontal, right to left: ArrowLeft moves an item later and ArrowRight earlier; a drag to the left moves it later', async () => {
    const moves: Array<{ from: number; to: number }> = [];
    await render(<div dir="rtl"><SortableList id="sl" aria-label="Missions" orientation="horizontal" items={ITEMS} getKey={(i) => i.id} getLabel={(i) => i.name}
      renderItem={(i) => i.name} onReorder={(_n, m) => { moves.push(m); }} /></div>);
    handle('Gemini').focus();
    await userEvent.keyboard(' {ArrowLeft}');
    await said('Gemini, position 3 of 4.');
    await userEvent.keyboard('{ArrowRight}{ArrowRight} ');
    expect(moves).toEqual([{ from: 1, to: 0 }]);
    const rows = [...document.querySelectorAll('#sl > li')] as HTMLElement[];
    const h = handle('Apollo'), r = h.getBoundingClientRect(), third = rows[2].getBoundingClientRect();
    expect(third.right < r.left).toBe(true);
    const at = (type: string, x: number, target: EventTarget = window) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 10, button: 0, isPrimary: true, clientX: x, clientY: r.top + 4 }));
    at('pointerdown', r.right - 4, h);
    at('pointermove', r.right - 20);
    at('pointermove', third.left + 4);
    at('pointerup', third.left + 4);
    await expect.poll(() => moves).toEqual([{ from: 1, to: 0 }, { from: 0, to: 2 }]);
  });

  test('horizontal: a row wider than its space scrolls inside itself, not the page (WCAG 1.4.10); held near its right edge, it scrolls that way', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: 'm' + i, name: 'Mission ' + i }));
    await render(<div style={{ width: '320px' }}><SortableList id="sl" aria-label="Missions" orientation="horizontal" items={many} getKey={(i) => i.id} getLabel={(i) => i.name}
      onReorder={() => undefined} renderItem={(i) => <span>{i.name}</span>} /></div>);
    const ul = document.getElementById('sl')!, h = handle('Mission 0'), r = h.getBoundingClientRect(), b = ul.getBoundingClientRect();
    expect([Math.round(b.width), ul.scrollWidth > ul.clientWidth]).toEqual([320, true]);
    const at = (type: string, x: number, target: EventTarget = window) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 11, button: 0, isPrimary: true, clientX: x, clientY: r.top + 4 }));
    at('pointerdown', r.left + 4, h);
    at('pointermove', r.left + 20);
    at('pointermove', b.right - 4);
    await expect.poll(() => ul.scrollLeft, { timeout: 3000 }).toBeGreaterThan(150);
    at('pointerup', b.right - 4);
  });

  test('disabled: no handles and no instructions; the rows stay', async () => {
    await render(<List disabled />);
    expect([document.querySelectorAll('#sl button').length, names().length, document.getElementById('sl')!.classList.contains('dk-sortable-list--disabled')]).toEqual([0, 4, true]);
  });

  test('words from SerupaProvider labels (Indonesian)', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><SortableList id="sl" items={ITEMS.slice(0, 2)} getKey={(i) => i.id} getLabel={(i) => i.name} renderItem={(i) => i.name} onReorder={() => undefined} /></SerupaProvider>);
    expect(handle('Apollo').getAttribute('aria-label')).toBe('Ubah urutan Apollo');
    handle('Apollo').focus();
    await userEvent.keyboard(' ');
    await said('Apollo diangkat, posisi 1 dari 2.');
    await userEvent.keyboard('{Escape}');
  });

  test('reorderLabel names the handles', async () => {
    await render(<SortableList id="sl" reorderLabel="Move" items={ITEMS.slice(0, 1)} getKey={(i) => i.id} getLabel={(i) => i.name} renderItem={(i) => i.name} onReorder={() => undefined} />);
    expect(handle('Apollo').getAttribute('aria-label')).toBe('Move Apollo');
  });

  test('contrast: the handle keeps 3:1 and the text 4.5:1 on the row, in all six themes', async () => {
    await render(<List />);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
      const row = document.querySelector('#sl > li')!, bg = css(row).backgroundColor;
      for (const [el, need] of [[row.querySelector('.dk-sortable-list__handle'), 3], [row.querySelector('.dk-sortable-list__content'), 4.5]] as const) {
        const r = contrast(css(el).color, bg);
        if (r < need) low.push(`${th} ${(el as Element).className} ${r.toFixed(2)}`);
      }
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });
  test('autoFocus focuses the first handle, not the list', async () => {
    await render(<SortableList id="sl" autoFocus items={ITEMS} getKey={(i) => i.id} getLabel={(i) => i.name} renderItem={(i) => i.name} onReorder={() => undefined} />);
    await expect.poll(() => document.activeElement).toBe(handle('Apollo'));
    expect(document.getElementById('sl')!.hasAttribute('autofocus')).toBe(false);
  });

  test('moves glide (EP1): the rows that change place start where they were and slide to their slot on translate; at rest nothing is offset', async () => {
    await withMotion(async () => {
      await render(<List />);
      const row = (name: string) => handle(name).closest('li') as HTMLElement;
      const top = (name: string) => row(name).getBoundingClientRect().top;
      const before = { gemini: top('Gemini'), mercury: top('Mercury') };
      handle('Gemini').focus();
      await userEvent.keyboard(' {ArrowDown}');
      const moving = ['Gemini', 'Mercury'].map((n) => row(n).getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty));
      // A frame in, each is still near its old place: Gemini above its new slot, Mercury below its new one.
      expect([moving, Math.abs(top('Gemini') - before.gemini) < Math.abs(top('Gemini') - before.mercury), row('Apollo').getAnimations().length])
        .toEqual([[['translate'], ['translate']], true, 0]);
      await Promise.all(document.getAnimations().map((a) => a.finished));
      expect([names(), Math.round(top('Gemini')), Math.round(top('Mercury')), css(row('Gemini')).translate])
        .toEqual([['Apollo', 'Mercury', 'Gemini', 'Artemis'], Math.round(before.mercury), Math.round(before.gemini), 'none']);
    });
  });

  for (const orientation of ['horizontal', 'vertical'] as const) {
    test(`GR69: an item moved with the keyboard stays in view, ${orientation}, in a box shorter than the list`, async () => {
      const many = Array.from({ length: 12 }, (_, i) => ({ id: 'm' + i, name: 'Mission ' + (i + 1) }));
      await render(<div id="box" style={{ width: 300, height: 200, overflow: 'auto' }}><SortableList id="sl" aria-label="Missions" orientation={orientation} items={many} getKey={(i) => i.id} getLabel={(i) => i.name}
        renderItem={(i) => i.name} onReorder={() => {}} /></div>);
      const box = document.getElementById('box')!, h = handle('Mission 1');
      h.focus();
      await userEvent.keyboard(' ');
      for (let i = 0; i < 11; i++) await userEvent.keyboard(orientation === 'horizontal' ? '{ArrowRight}' : '{ArrowDown}');
      const row = h.closest('li')!.getBoundingClientRect(), b = box.getBoundingClientRect();
      expect([row.left >= b.left - 1, row.right <= b.right + 1, row.top >= b.top - 1, row.bottom <= b.bottom + 1]).toEqual([true, true, true, true]);
      await userEvent.keyboard(' ');
    });
  }
});
