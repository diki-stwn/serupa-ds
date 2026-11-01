import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press } from '../../../tools/test/vitest/helpers';
import { TreeView, type TreeViewItem } from './TreeView';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const items = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('[role=treeitem]')];
const shown = () => items().map((i) => i.dataset.id).join();
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.id;
const item = (id: string) => items().find((i) => i.dataset.id === id)!;
const row = (id: string) => item(id).firstElementChild as HTMLElement;   // the row a person sees and clicks

const TREE: TreeViewItem[] = [
  { id: 'a', label: 'Apples', children: [
    { id: 'a1', label: 'Braeburn' },
    { id: 'a2', label: 'Cox', children: [{ id: 'a2x', label: 'Orange Pippin' }] },
  ] },
  { id: 'b', label: 'Bananas', disabled: true, children: [{ id: 'b1', label: 'Cavendish' }] },
  { id: 'c', label: 'Cherries' },
  { id: 'd', label: 'Dates', children: [{ id: 'd1', label: 'Medjool' }] },
];

function Tree(props: Partial<React.ComponentProps<typeof TreeView>>) {
  return (
    <>
      <button id="before">Before</button>
      <TreeView id="t" aria-label="Fruit" items={TREE} {...props} />
      <button id="after">After</button>
    </>
  );
}
const enter = async () => { el('before').focus(); await userEvent.keyboard('{Tab}'); };

describe('TreeView', () => {
  test('a role="tree" <ul> of treeitems with level, position and expanded state; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLUListElement>();
    await render(<TreeView id="x" ref={ref} aria-label="Fruit" items={TREE} defaultExpanded={['a']} className="extra" data-x="y" />);
    const e = el('x');
    expect([e.tagName, e.getAttribute('role'), e.getAttribute('aria-label'), ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['UL', 'tree', 'Fruit', true, 'dk-tree-view extra', 'y', 'tree-view']);
    expect(shown()).toBe('a,a1,a2,b,c,d');   // closed items' children aren't in the page
    const a2 = item('a2');
    expect([a2.getAttribute('aria-level'), a2.getAttribute('aria-posinset'), a2.getAttribute('aria-setsize'), a2.getAttribute('aria-expanded'), item('c').getAttribute('aria-expanded')])
      .toEqual(['2', '2', '2', 'false', null]);
    expect([item('a').getAttribute('aria-expanded'), a2.parentElement!.getAttribute('role'), item('b').getAttribute('aria-disabled')]).toEqual(['true', 'group', 'true']);
  });

  test('an item with children says data-state open or closed; a leaf says nothing (G11, ADR 0012)', async () => {
    await render(<Tree defaultExpanded={['a']} />);
    expect(['a', 'a1', 'a2', 'd'].map((i) => item(i).dataset.state ?? '-')).toEqual(['open', '-', 'closed', 'closed']);
    item('d').focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => item('d').dataset.state).toBe('open');
  });

  test('one Tab stop: the first item, or the first picked one; Tab leaves; coming back lands on the item used last', async () => {
    await render(<Tree defaultValue={['c']} />);
    expect(items().map((i) => i.tabIndex)).toEqual([-1, -1, 0, -1]);
    await enter();
    expect(focused()).toBe('c');
    await userEvent.keyboard('{ArrowDown}{Tab}');
    expect(document.activeElement!.id).toBe('after');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(focused()).toBe('d');
  });

  test('Up and Down move through the items in view, stopping at the ends; Home and End go to the first and last', async () => {
    await render(<Tree defaultExpanded={['a']} />);
    await enter();
    await userEvent.keyboard('{ArrowUp}');
    expect(focused()).toBe('a');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(focused()).toBe('b');   // a disabled item can still be focused and read
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('d');
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('d');
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe('a');
  });

  test('Right opens and then goes to the first child; Left closes and then goes to the parent; onExpandedChange hears each', async () => {
    const onExpandedChange = vi.fn();
    await render(<Tree onExpandedChange={onExpandedChange} />);
    await enter();
    await userEvent.keyboard('{ArrowRight}');
    expect([shown(), focused(), onExpandedChange.mock.calls.at(-1)![0]]).toEqual(['a,a1,a2,b,c,d', 'a', ['a']]);
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('a1');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('a1');   // a leaf: nothing
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
    expect([shown(), focused()]).toEqual(['a,a1,a2,a2x,b,c,d', 'a2x']);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('a2');
    await userEvent.keyboard('{ArrowLeft}');
    expect([shown(), focused()]).toEqual(['a,a1,a2,b,c,d', 'a2']);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('a');
    await userEvent.keyboard('{ArrowLeft}');
    expect([shown(), onExpandedChange.mock.calls.at(-1)![0]]).toEqual(['a,b,c,d', []]);
  });

  test('right to left, the arrows swap: Left opens and Right closes', async () => {
    await render(<Tree dir="rtl" />);
    await enter();
    await userEvent.keyboard('{ArrowLeft}');
    expect(shown()).toBe('a,a1,a2,b,c,d');
    await userEvent.keyboard('{ArrowRight}');
    expect(shown()).toBe('a,b,c,d');
  });

  test('a disabled item doesn\'t open, close or get picked; * opens every sibling that can open', async () => {
    const onValueChange = vi.fn();
    await render(<Tree onValueChange={onValueChange} />);
    await enter();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}');
    expect([shown(), onValueChange.mock.calls.length]).toEqual(['a,b,c,d', 0]);
    await userEvent.keyboard('*');
    expect(shown()).toBe('a,a1,a2,b,c,d,d1');
  });

  test('single: Enter, Space or a click picks one item; aria-selected marks only it', async () => {
    const onValueChange = vi.fn();
    await render(<Tree onValueChange={onValueChange} />);
    await enter();
    await userEvent.keyboard('{Enter}');
    expect([onValueChange.mock.calls.at(-1)![0], item('a').getAttribute('aria-selected'), item('c').getAttribute('aria-selected')]).toEqual([['a'], 'true', null]);
    await userEvent.keyboard('{End} ');
    expect(onValueChange.mock.calls.at(-1)![0]).toEqual(['d']);
    await userEvent.click(row('c'));
    expect([onValueChange.mock.calls.at(-1)![0], focused(), item('c').classList.contains('dk-tree-view__item--selected')]).toEqual([['c'], 'c', true]);
    expect(el('t').hasAttribute('aria-multiselectable')).toBe(false);
  });

  test('a click on the chevron opens and closes without picking; closing an item that holds focus moves focus to it', async () => {
    const onValueChange = vi.fn();
    await render(<Tree onValueChange={onValueChange} />);
    const chevron = (id: string) => row(id).firstElementChild as HTMLElement;
    await userEvent.click(chevron('a'));
    expect([shown(), onValueChange.mock.calls.length]).toEqual(['a,a1,a2,b,c,d', 0]);
    await userEvent.click(row('a1'));
    expect(focused()).toBe('a1');
    await userEvent.click(chevron('a'));
    expect([shown(), focused()]).toEqual(['a,b,c,d', 'a']);
  });

  test('multiple: Space and clicks toggle, Shift+arrows pick as they move, Shift+Space and Shift+click pick a range, Ctrl+A picks all in view', async () => {
    const onValueChange = vi.fn();
    const last = () => [...(onValueChange.mock.calls.at(-1)![0] as string[])].sort().join();
    await render(<Tree selectionMode="multiple" defaultExpanded={['a']} onValueChange={onValueChange} />);
    expect([el('t').getAttribute('aria-multiselectable'), item('c').getAttribute('aria-selected')]).toEqual(['true', 'false']);
    await enter();
    await userEvent.keyboard(' ');
    expect(last()).toBe('a');
    await userEvent.keyboard(' ');
    expect(onValueChange.mock.calls.at(-1)![0]).toEqual([]);
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
    expect([last(), focused()]).toEqual(['a1,a2', 'a2']);
    await userEvent.keyboard('{End}{Shift>} {/Shift}');
    expect(last()).toBe('a1,a2,c,d');   // from a2, the last one picked, to d; b is disabled
    await userEvent.click(row('a1'));
    expect(last()).toBe('a2,c,d');
    await userEvent.keyboard('{Control>}a{/Control}');
    expect(last()).toBe('a,a1,a2,c,d');
  });

  test('L8E111: Ctrl+A or a Shift range over items all picked already calls no onValueChange', async () => {
    const onValueChange = vi.fn();
    await render(<Tree selectionMode="multiple" defaultExpanded={['a']} onValueChange={onValueChange} />);
    await enter();
    await userEvent.keyboard('{Control>}a{/Control}');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Control>}a{/Control}');   // everything is picked already
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await userEvent.click(row('a1'));
    await userEvent.click(row('a1'));   // picked again, and now the anchor
    expect(onValueChange).toHaveBeenCalledTimes(3);
    await userEvent.keyboard('{End}{Shift>} {/Shift}');   // a1 to d, all picked already
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });

  test('L8E4: Ctrl+A picks all on a layout whose A key types another script (Russian "ф"), by the key\'s position', async () => {
    const onValueChange = vi.fn();
    await render(<Tree selectionMode="multiple" defaultExpanded={['a']} onValueChange={onValueChange} />);
    await enter();
    const ctrl = (key: string, code: string) => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, code, ctrlKey: true, bubbles: true, cancelable: true }));
    ctrl('q', 'KeyA');   // AZERTY: the key in A's place types "q", which isn't Ctrl+A
    expect(onValueChange).not.toHaveBeenCalled();
    ctrl('ф', 'KeyA');
    expect([...(onValueChange.mock.calls.at(-1)![0] as string[])].sort().join()).toBe('a,a1,a2,c,d');
  });

  test('none: no aria-selected, and Enter, Space or a click opens and closes', async () => {
    await render(<Tree selectionMode="none" />);
    expect(item('a').hasAttribute('aria-selected')).toBe(false);
    await enter();
    await userEvent.keyboard('{Enter}');
    expect(shown()).toBe('a,a1,a2,b,c,d');
    await userEvent.keyboard(' ');
    expect(shown()).toBe('a,b,c,d');
    await userEvent.click(row('d'));
    expect(shown()).toBe('a,b,c,d,d1');
  });

  test('typing goes to the next item in view starting with what was typed, ignoring case and accents', async () => {
    await render(<Tree defaultExpanded={['a']} />);
    await enter();
    await userEvent.keyboard('c');
    expect(focused()).toBe('a2');
    await userEvent.keyboard('h');
    expect(focused()).toBe('c');
    await new Promise((r) => setTimeout(r, 600));
    await userEvent.keyboard('d');
    expect(focused()).toBe('d');
  });

  test('a Space typed within a word is part of it ("my files"), not a pick; after a pause Space picks (GQ4)', async () => {
    const files: TreeViewItem[] = [{ id: 'f1', label: 'my file' }, { id: 'f2', label: 'my files' }, { id: 's', label: 'src' }];
    await render(<><button id="before">Before</button><TreeView aria-label="Files" items={files} /></>);
    await enter();
    await userEvent.keyboard('my files');
    expect(focused()).toBe('f2');
    expect(items().filter((i) => i.getAttribute('aria-selected') === 'true')).toEqual([]);
    await new Promise((r) => setTimeout(r, 600));
    await userEvent.keyboard(' ');
    expect(item('f2').getAttribute('aria-selected')).toBe('true');
  });

  test('controlled: value and expanded come from props, and change only when the parent passes new ones', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<string[]>(['c']);
      const [expanded, setExpanded] = React.useState<string[]>([]);
      return <><Tree value={value} onValueChange={setValue} expanded={expanded} onExpandedChange={setExpanded} /><output id="out">{value.join() + '|' + expanded.join()}</output></>;
    }
    await render(<Controlled />);
    await enter();
    await userEvent.keyboard('{Home}{ArrowRight}{Enter}');
    expect(el('out').textContent).toBe('a|a');
  });

  test('controlled without handlers: nothing opens or changes', async () => {
    await render(<Tree value={['c']} expanded={[]} />);
    await enter();
    await userEvent.keyboard('{Home}{ArrowRight}{Enter}');
    expect([shown(), item('c').getAttribute('aria-selected')]).toEqual(['a,b,c,d', 'true']);
  });

  test('rows are 32px, each level 16px further in; the picked row has a highlight and a bar', async () => {
    await render(<Tree defaultExpanded={['a', 'a2']} defaultValue={['a2x']} />);
    const pad = (id: string) => parseFloat(css(row(id)).paddingInlineStart);
    expect([row('a').offsetHeight, pad('a1') - pad('a'), pad('a2x') - pad('a1')]).toEqual([32, 16, 16]);
    expect(css(row('a2x')).boxShadow).not.toBe('none');
  });

  test('its labels read 4.5:1 on its background, and the picked row\'s on its highlight, in all six themes', async () => {
    await render(<TreeView id="c" aria-label="Fruit" items={TREE} defaultValue={['c']} />);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(el('c')).color, css(el('c')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
      expect(contrast(css(row('c')).color, css(row('c')).backgroundColor), th + ' picked').toBeGreaterThanOrEqual(4.5);
    }
  });

  test('a focus move or a pick redraws only the rows it changes, not every row in view (DE1): 3,060 items, 60 folders open', async () => {
    // A row reads its item's label each time it draws: counting the reads counts the draws.
    const draws = new Map<string, number>();
    const counted = (id: string, text: string, children?: TreeViewItem[]): TreeViewItem => {
      const it = { id, textValue: text, children } as TreeViewItem;
      Object.defineProperty(it, 'label', { enumerable: true, get: () => { draws.set(id, (draws.get(id) || 0) + 1); return text; } });
      return it;
    };
    const big: TreeViewItem[] = [], openIds: string[] = [];
    for (let f = 0; f < 60; f++) {
      const kids: TreeViewItem[] = [];
      for (let i = 0; i < 50; i++) kids.push(counted(f + '-' + i, 'File ' + i));
      big.push(counted('f' + f, 'Folder ' + f, kids));
      openIds.push('f' + f);
    }
    await render(<TreeView id="big" aria-label="Files" items={big} defaultExpanded={openIds} selectionMode="multiple" />);
    expect(items().length).toBe(3060);
    item('f0').focus();
    draws.clear();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('0-0');
    expect([...draws.keys()].sort()).toEqual(['0-0', 'f0']);
    draws.clear();
    await userEvent.keyboard(' ');
    expect(item('0-0').getAttribute('aria-selected')).toBe('true');
    expect([...draws.keys()]).toEqual(['0-0']);
    draws.clear();
    // Closing a folder redraws that folder (its children leave the page), not the other 59.
    item('f1').focus();
    draws.clear();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('f1').getAttribute('aria-expanded')).toBe('false');
    expect([...draws.keys()].sort()).toEqual(['0-0', 'f1']);
  });

  test('pressed: a row held down fills with pressed at once; a disabled row doesn\'t (ED1)', async () => {
    await render(<Tree />);
    await press(row('c'), () => expect.poll(() => css(row('c')).backgroundColor).toBe(color('var(--pressed)')));
    await press(row('b'), () => expect(css(row('b')).backgroundColor).not.toBe(color('var(--pressed)')));
  });
});

describe('TreeView target size (GQ6)', () => {
  test('a chevron is a 24px target (WCAG 2.5.8): a click 1.5px outside its 20px box still opens the item, and doesn\'t pick it', async () => {
    const onValueChange = vi.fn();
    await render(<Tree selectionMode="single" onValueChange={onValueChange} />);
    const toggle = row('a').firstElementChild as HTMLElement, r = toggle.getBoundingClientRect();
    expect([Math.round(r.width), Math.round(r.height)]).toEqual([20, 20]);
    await userEvent.click(toggle, { position: { x: -1.5, y: 10 } });
    expect([item('a').getAttribute('aria-expanded'), onValueChange.mock.calls.length]).toEqual(['true', 0]);
    await userEvent.click(toggle, { position: { x: 21.5, y: 21.5 } });
    expect(item('a').getAttribute('aria-expanded')).toBe('false');
  });
  test('the focused item leaving the page (deleted from items, or its parent closed by a controlled expanded) hands focus to the item in its place or to its parent, not to the page', async () => {
    let drop: (id: string) => void = () => {}, close: (id: string) => void = () => {};
    function Live() {
      const [list, setList] = React.useState(TREE);
      const [open, setOpen] = React.useState(['a', 'd']);
      drop = (id) => setList((l) => l.filter((x) => x.id !== id));
      close = (id) => setOpen((o) => o.filter((x) => x !== id));
      return <Tree items={list} expanded={open} onExpandedChange={setOpen} />;
    }
    await render(<Live />);
    item('c').focus();
    await expect.poll(() => item('c').tabIndex).toBe(0);   // the tree has seen it
    drop('c');   // an app's own Delete key, or a server update
    await expect.poll(() => [shown(), focused()]).toEqual(['a,a1,a2,b,d,d1', 'd']);
    item('d1').focus();
    await expect.poll(() => item('d1').tabIndex).toBe(0);
    close('d');   // an app's own "Collapse all"
    await expect.poll(() => [shown(), focused()]).toEqual(['a,a1,a2,b,d', 'd']);
    drop('d');   // the last one: the one before
    await expect.poll(() => focused()).toBe('b');
    el('after').focus();
    drop('b');   // focus is elsewhere: it stays there
    await expect.poll(() => shown()).toBe('a,a1,a2');
    expect(document.activeElement).toBe(el('after'));
  });
});
