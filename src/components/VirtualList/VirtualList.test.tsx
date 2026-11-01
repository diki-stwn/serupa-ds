import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { ListItem } from '../List/List';
import { VirtualList } from './VirtualList';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const rows = (id: string) => [...el(id).children] as HTMLElement[];
// The innermost element in a row whose text is (or, for a title, starts with) the given text.
const leaf = (r: Element, test: (t: string) => boolean) => [...r.querySelectorAll('*')].find((x) => x.childElementCount === 0 && test(x.textContent || ''))!;
const title = (r: Element) => leaf(r, (t) => t.startsWith('Row ')).textContent;
const titles = (id: string) => rows(id).map(title);
const item = (i: number) => <ListItem title={'Row ' + (i + 1)} />;
// Scrolls and waits for the rows to follow.
const scrollTo = async (id: string, top: number) => { el(id).scrollTop = top; el(id).dispatchEvent(new Event('scroll')); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); };

describe('VirtualList', () => {
  test('a <ul role="list"> that scrolls and takes focus; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLUListElement>();
    await render(<VirtualList id="v" ref={ref} className="extra" data-x="y" aria-label="Rows" count={3} renderItem={item} />);
    const e = el('v');
    expect([e.tagName, e.getAttribute('role'), e.tabIndex, ref.current === e, e.classList.contains('extra'), e.classList.contains('dk-list'), e.dataset.x, e.dataset.component, e.getAttribute('aria-label')])
      .toEqual(['UL', 'list', 0, true, true, true, 'y', 'virtual-list', 'Rows']);
    expect(titles('v')).toEqual(['Row 1', 'Row 2', 'Row 3']);
    expect(css(e).overflowY).toBe('auto');
  });

  test('of 10,000 rows it draws only those in view and a few more; each says where it is in the whole list', async () => {
    await render(<VirtualList id="v" aria-label="Rows" count={10000} renderItem={item} />);
    await expect.poll(() => rows('v').length).toBeLessThan(30);
    expect(rows('v').length).toBeGreaterThan(5);
    const first = rows('v')[0];
    expect([first.tagName, first.getAttribute('aria-posinset'), first.getAttribute('aria-setsize')]).toEqual(['LI', '1', '10000']);
    // The padding stands in for the rest: the scroll range is about all the rows'.
    const h = rows('v')[1].getBoundingClientRect().height;   // the first row has no line above it
    expect(Math.abs(el('v').scrollHeight - 10000 * h)).toBeLessThan(10000 * h * 0.02);
  });

  test('scrolling draws the rows now in view; the last row can be reached', async () => {
    await render(<VirtualList id="v" aria-label="Rows" count={10000} renderItem={item} />);
    await expect.poll(() => rows('v').length).toBeLessThan(30);
    const h = rows('v')[1].getBoundingClientRect().height;   // the first row has no line above it
    await scrollTo('v', h * 5000);
    // Rows not drawn yet count as the average height so far, so about row 5,000 is at the top (to within a few rows).
    const top = () => rows('v').find((x) => x.getBoundingClientRect().bottom > el('v').getBoundingClientRect().top + 1)!;
    await expect.poll(() => Math.abs(Number(top().getAttribute('aria-posinset')) - 5001)).toBeLessThan(10);
    expect(titles('v')).not.toContain('Row 1');
    expect(rows('v').length).toBeLessThan(30);
    await scrollTo('v', el('v').scrollHeight);
    await scrollTo('v', el('v').scrollHeight);
    await expect.poll(() => titles('v').at(-1)).toBe('Row 10000');
    const last = rows('v').at(-1)!.getBoundingClientRect(), box = el('v').getBoundingClientRect();
    expect(last.bottom).toBeLessThanOrEqual(box.bottom + 1);
    expect(last.bottom).toBeGreaterThan(box.bottom - h);
  });

  test('rows of different heights are measured once drawn, and a row taller than the guess above the view doesn\'t move what\'s seen', async () => {
    const tall = (i: number) => <ListItem title={'Row ' + (i + 1)} description={i % 2 ? 'One line' : 'A description long enough to wrap onto several lines in a narrow list, so this row is much taller than the guess'} />;
    await render(<div style={{ width: 240 }}><VirtualList id="v" aria-label="Rows" count={2000} renderItem={tall} estimatedItemHeight={40} /></div>);
    await expect.poll(() => rows('v').length).toBeGreaterThan(3);
    await scrollTo('v', 20000);
    await scrollTo('v', el('v').scrollTop);
    const seen = rows('v').find((r) => r.getBoundingClientRect().top >= el('v').getBoundingClientRect().top)!;
    const name = title(seen), at = seen.getBoundingClientRect().top;
    await scrollTo('v', el('v').scrollTop);
    const again = rows('v').find((r) => title(r) === name)!;
    expect(Math.abs(again.getBoundingClientRect().top - at)).toBeLessThan(2);
    await scrollTo('v', el('v').scrollHeight);
    await scrollTo('v', el('v').scrollHeight);
    await scrollTo('v', el('v').scrollHeight);
    await expect.poll(() => titles('v').at(-1)).toBe('Row 2000');
  });

  test('a row with focus stays drawn when it scrolls out of view, so focus isn\'t lost; Tab moves on from it', async () => {
    const link = (i: number) => <ListItem href={'#r' + i} title={'Row ' + (i + 1)} />;
    await render(<><VirtualList id="v" aria-label="Rows" count={5000} renderItem={link} /><button id="after">After</button></>);
    await expect.poll(() => rows('v').length).toBeGreaterThan(3);
    const a = el('v').querySelector<HTMLAnchorElement>('a[href="#r1"]')!;
    a.focus();
    await scrollTo('v', 60000);
    await expect.poll(() => titles('v')).not.toContain('Row 1');   // the window moved on...
    expect([document.activeElement === a, a.isConnected, a.closest('li')!.getAttribute('aria-posinset')]).toEqual([true, true, '2']);   // ...but row 2 is still drawn and focused
    await scrollTo('v', 0);
    await expect.poll(() => titles('v').slice(0, 3)).toEqual(['Row 1', 'Row 2', 'Row 3']);
    expect(document.activeElement).toBe(a);   // and it's the same element back in its place
    a.blur();
    await expect.poll(() => rows('v').filter((r) => r.style.position === 'absolute').length).toBe(0);
  });

  test('the keyboard scrolls it once it has focus', async () => {
    await render(<VirtualList id="v" aria-label="Rows" count={1000} renderItem={item} />);
    el('v').focus();
    await userEvent.keyboard('{End}');
    await expect.poll(() => el('v').scrollTop).toBeGreaterThan(1000);
    await expect.poll(() => titles('v').at(-1)).toBe('Row 1000');
  });

  test('fewer rows, or none, after a change; itemKey keeps a row\'s element when rows before it go', async () => {
    const ids = Array.from({ length: 50 }, (_, i) => 'id' + i);
    const page = (list: string[]) => <VirtualList id="v" aria-label="Rows" count={list.length} itemKey={(i) => list[i]} renderItem={(i) => <ListItem title={list[i]} />} />;
    const screen = await render(page(ids));
    const third = rows('v')[2];
    await screen.rerender(page(ids.slice(1)));
    expect([rows('v')[1] === third, rows('v')[1].getAttribute('aria-setsize')]).toEqual([true, '49']);
    await screen.rerender(page([]));
    expect([rows('v').length, el('v').style.getPropertyValue('--dk-vl-after'), el('v').scrollHeight <= el('v').clientHeight]).toEqual([0, '0px', true]);
  });

  test('GR93: after a jump to the middle, each small scroll moves the view by about as much, while the rows it brings in are measured', async () => {
    const at = () => { const box = el('v').getBoundingClientRect().top; const r = rows('v').find((x) => x.getBoundingClientRect().bottom > box + 1)!; return Number(r.getAttribute('aria-posinset')) * 1000 + (box - r.getBoundingClientRect().top); };
    const screen = await render(<div />);
    for (const count of [10000, 100000]) {
      await screen.rerender(<VirtualList key={count} id="v" aria-label="Rows" count={count} renderItem={item} />);
      await expect.poll(() => rows('v').length).toBeLessThan(30);
      const h = rows('v')[1].getBoundingClientRect().height;
      await scrollTo('v', el('v').scrollHeight / 2);
      await new Promise((r) => setTimeout(r, 300));
      for (let k = 0; k < 5; k++) {
        // Where the view is, as row * 1000 + px into it: 40px further down is 40px further into the rows.
        const was = at();
        el('v').scrollTop += 40;
        await new Promise((r) => setTimeout(r, 200));
        const moved = at() - was, rowsMoved = Math.round(moved / 1000);
        expect(Math.abs(rowsMoved * h + (moved - rowsMoved * 1000) - 40), `step ${k + 1} of ${count}`).toBeLessThan(2);
      }
    }
  });

  test('Tab through rows of links: the list scrolls to show each one (it used to scroll back to the top, leaving focus out of view)', async () => {
    const link = (i: number) => <ListItem href="#" title={'Row ' + (i + 1)} />;
    await render(<><button id="b">b</button><VirtualList id="v" aria-label="Rows" count={10000} renderItem={link} /></>);
    await expect.poll(() => rows('v').length).toBeLessThan(30);
    el('b').focus();
    for (let k = 0; k < 20; k++) await userEvent.tab();
    const box = el('v').getBoundingClientRect(), r = document.activeElement!.getBoundingClientRect();
    expect(document.activeElement!.closest('[data-index]')?.getAttribute('data-index')).toBe('18');
    expect([r.top >= box.top - 1, r.bottom <= box.bottom + 1, el('v').scrollTop > 0]).toEqual([true, true, true]);
  });

  test('GR94: past the height limit (10,000,000 rows), the arrow and Page keys and the wheel move through the rows as in a short list, and stop at either end', async () => {
    const first = () => { const box = el('v').getBoundingClientRect().top; return Number(rows('v').find((x) => x.getBoundingClientRect().bottom > box + 1)!.getAttribute('aria-posinset')); };
    await render(<VirtualList id="v" aria-label="Rows" count={10_000_000} renderItem={item} />);
    await expect.poll(() => rows('v').length).toBeLessThan(30);
    const h = rows('v')[1].getBoundingClientRect().height, page = Math.floor(el('v').clientHeight * 0.875 / h);
    await scrollTo('v', (el('v').scrollHeight - el('v').clientHeight) / 2);
    await new Promise((r) => setTimeout(r, 300));
    el('v').focus();
    const step = async (key: string, rows: number) => {
      const was = first();
      await userEvent.keyboard(key);
      await new Promise((r) => setTimeout(r, 100));
      expect(Math.abs(first() - was - rows), key).toBeLessThanOrEqual(1);
    };
    await step('{ArrowDown}', 40 / h);
    await step('{ArrowDown}', 40 / h);
    await step('{PageDown}', page);
    await step('{PageUp}', -page);
    await step('{ArrowUp}', -40 / h);
    let was = first();
    el('v').dispatchEvent(new WheelEvent('wheel', { deltaY: 3 * h, bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 100));
    expect(Math.abs(first() - was - 3)).toBeLessThanOrEqual(1);
    // At the top, the wheel up is left to the page; Home and End still go to either end.
    await userEvent.keyboard('{Home}');
    await expect.poll(() => titles('v')[0], { timeout: 5000 }).toBe('Row 1');   // the browser's smooth scroll
    const up = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    el('v').dispatchEvent(up);
    expect(up.defaultPrevented).toBe(false);
    await userEvent.keyboard('{End}');
    await expect.poll(() => rows('v').at(-1)?.getAttribute('aria-posinset'), { timeout: 5000 }).toBe('10000000');
    was = first();
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(first()).toBe(was);
  });

  test('GR91, GR92: End on 600,000 and 1,000,000 rows taller than the guess reaches the last row without an update loop; past the browser\'s height limit the scroll range is scaled down, and the top comes back', async () => {
    const tall = (i: number) => <ListItem title={'Row ' + (i + 1)} description="A second line, so the row is taller than the guess" />;
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => { errors.push(e.error || e.message); };
    window.addEventListener('error', onError);
    try {
      const screen = await render(<div />);
      for (const count of [600000, 1000000]) {
        await screen.rerender(<VirtualList key={count} id="big" aria-label="Rows" count={count} renderItem={tall} />);
        el('big').focus();
        for (let k = 0; k < 3; k++) {
          await userEvent.keyboard('{End}');
          await expect.poll(() => rows('big').at(-1)?.getAttribute('aria-posinset')).toBe(String(count));
          await scrollTo('big', 0);
          await expect.poll(() => titles('big')[0]).toBe('Row 1');
        }
        expect(el('big').scrollHeight).toBeLessThanOrEqual(16_000_000);
        await userEvent.keyboard('{End}');
        await expect.poll(() => rows('big').at(-1)?.getAttribute('aria-posinset')).toBe(String(count));
        const last = rows('big').at(-1)!.getBoundingClientRect(), box = el('big').getBoundingClientRect();
        expect(Math.abs(last.bottom - box.bottom)).toBeLessThan(2);   // the last row sits at the bottom, all of it shown
        // Half way down the scrollbar is about half way down the rows.
        await scrollTo('big', (el('big').scrollHeight - el('big').clientHeight) / 2);
        const mid = Number(rows('big')[0].getAttribute('aria-posinset'));
        expect(Math.abs(mid - count / 2)).toBeLessThan(count * 0.02);
      }
    } finally { window.removeEventListener('error', onError); }
    expect(errors).toEqual([]);
  });

  test('its rows and focus ring read in all six themes', async () => {
    await render(<VirtualList id="v" variant="card" aria-label="Rows" count={100} renderItem={(i) => <ListItem title={'Row ' + i} description="Muted" />} />);
    el('v').focus();
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = css(el('v')).backgroundColor;
      const r = rows('v')[0];
      for (const text of ['Row 0', 'Muted']) { const c = contrast(css(leaf(r, (t) => t === text)).color, bg); if (c < 4.5) low.push(`${th} ${text} ${c.toFixed(2)}`); }
      const ring = contrast(css(el('v')).outlineColor, css(document.body).backgroundColor);
      if (ring < 3) low.push(`${th} ring ${ring.toFixed(2)}`);
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
    expect(low).toEqual([]);
  });
});
