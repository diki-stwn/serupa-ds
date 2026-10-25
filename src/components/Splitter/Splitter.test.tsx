import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Splitter } from './Splitter';
import { idLabels } from '../../internal/labels';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const handle = (id: string) => el(id).querySelector<HTMLElement>('[role=separator]')!;
const first = (id: string) => document.getElementById(handle(id).getAttribute('aria-controls')!)!;
const now = (id: string) => Number(handle(id).getAttribute('aria-valuenow'));
const wide = (id: string) => Math.round(first(id).getBoundingClientRect().width);
const Two = (p: Partial<React.ComponentProps<typeof Splitter>>) => <Splitter id="s" style={{ width: '408px', height: '200px' }} {...p}>
  <nav id="nav"><a href="#a">Inbox</a></nav>
  <main id="main"><button>Reply</button></main>
</Splitter>;

describe('Splitter', () => {
  test('two panes and a focusable role="separator" between them: aria-orientation, aria-valuenow (the first pane\'s percent), min, max, aria-controls the first pane, a name; ref, className and other props reach the root', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Two ref={ref} className="extra" data-x="y" defaultSize={25} separatorLabel="Folders" />);
    const h = handle('s');
    expect([ref.current === el('s'), el('s').className, el('s').dataset.x, el('s').dataset.component]).toEqual([true, 'dk-splitter dk-splitter--horizontal extra', 'y', 'splitter']);
    expect([h.tabIndex, h.getAttribute('aria-orientation'), now('s'), h.getAttribute('aria-valuemin'), h.getAttribute('aria-valuemax'), h.getAttribute('aria-label')]).toEqual([0, 'vertical', 25, '10', '90', 'Folders']);
    expect([first('s').contains(el('nav')), el('main').parentElement !== first('s')]).toEqual([true, true]);
    // 25% of the 408px Splitter is 102px.
    expect([wide('s'), h.offsetWidth]).toEqual([102, 8]);
  });

  test('keyboard: ArrowRight and ArrowLeft move by step, Home and End go to min and max; ArrowUp does nothing on a side-by-side Splitter; onSizeChange gets each size', async () => {
    const calls: number[] = [];
    await render(<Two onSizeChange={(n) => calls.push(n)} min={20} max={70} step={10} />);
    handle('s').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}{ArrowUp}{End}{ArrowRight}{Home}{ArrowLeft}');
    expect([calls, now('s')]).toEqual([[60, 70, 60, 70, 20], 20]);
  });

  test('vertical: stacked panes, ArrowDown and ArrowUp move the handle; right to left: ArrowLeft grows the first pane, which is on the right', async () => {
    await render(<div>
      <Splitter id="v" direction="vertical" style={{ width: '300px', height: '408px' }}><p>Top</p><p>Bottom</p></Splitter>
      <div dir="rtl"><Splitter id="r" style={{ width: '408px', height: '100px' }}><p>Start</p><p>End</p></Splitter></div>
    </div>);
    expect([handle('v').getAttribute('aria-orientation'), Math.round(first('v').getBoundingClientRect().height)]).toEqual(['horizontal', 204]);
    handle('v').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowLeft}');
    expect(now('v')).toBe(55);
    handle('r').focus();
    await userEvent.keyboard('{ArrowLeft}');
    const r = el('r').getBoundingClientRect(), f = first('r').getBoundingClientRect();
    expect([now('r'), Math.round(r.right - f.right), Math.round(f.width)]).toEqual([55, 0, 224]);
  });

  test('collapsible: Enter collapses the first pane (hidden, so Tab skips it) and brings it back at its size; a double-click does the same; without it, Enter does nothing', async () => {
    await render(<div><Two collapsible defaultSize={30} /><Splitter id="n" style={{ width: '200px', height: '50px' }}><p>A</p><p>B</p></Splitter></div>);
    handle('s').focus();
    await userEvent.keyboard('{Enter}');
    expect([now('s'), handle('s').getAttribute('aria-valuemin'), first('s').hidden, wide('s')]).toEqual([0, '0', true, 0]);
    await userEvent.keyboard('{Enter}');
    expect([now('s'), first('s').hidden]).toEqual([30, false]);
    await userEvent.dblClick(handle('s'));
    expect(now('s')).toBe(0);
    await userEvent.keyboard('{ArrowRight}');
    expect(now('s')).toBe(10);   // out of collapse at min
    handle('n').focus();
    await userEvent.keyboard('{Enter}');
    expect(now('n')).toBe(50);
  });

  test('a pointer drag follows the pointer (captured), kept between min and max; focus moves to the handle', async () => {
    await render(<Two min={20} max={80} />);
    const h = handle('s'), box = el('s').getBoundingClientRect(), y = box.top + 50;
    const at = (type: string, x: number) => h.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX: x, clientY: y }));
    at('pointerdown', box.left + 204);
    at('pointermove', box.left + 102);
    await expect.poll(() => now('s')).toBe(25);
    at('pointermove', box.left + 2);
    await expect.poll(() => now('s')).toBe(20);
    at('pointerup', box.left + 2);
    at('pointermove', box.left + 300);
    expect([now('s'), document.activeElement]).toEqual([20, h]);
  });

  test('controlled size; storageKey keeps an uncontrolled size for the next visit; outside min..max is pulled in', async () => {
    function Ctl() {
      const [n, setN] = React.useState(40);
      return <><Splitter id="c" size={n} onSizeChange={setN} style={{ width: '208px' }}><p>A</p><p>B</p></Splitter><output id="cv">{n}</output></>;
    }
    localStorage.setItem('dk-test-split', '33');
    await render(<div><Ctl /><Splitter id="k" storageKey="dk-test-split" style={{ width: '208px' }}><p>A</p><p>B</p></Splitter><Splitter id="o" defaultSize={99} style={{ width: '208px' }}><p>A</p><p>B</p></Splitter></div>);
    handle('c').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([el('cv').textContent, now('c')]).toEqual(['45', 45]);
    await expect.poll(() => now('k')).toBe(33);
    handle('k').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect([localStorage.getItem('dk-test-split'), now('o')]).toEqual(['38', 90]);
    localStorage.removeItem('dk-test-split');
  });

  test('the handle\'s line is 3:1 on the page in all six themes; the default name comes from the resizePanes label', async () => {
    await render(<Two />);
    const line = (pseudo: string) => getComputedStyle(handle('s'), pseudo).backgroundColor;
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor;
      const r = contrast(line('::before'), page);
      if (r < 3) low.push(`${th}: ${r.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
    expect([handle('s').getAttribute('aria-label'), idLabels.resizePanes]).toEqual(['Resize panes', 'Ubah ukuran panel']);
  });
});
