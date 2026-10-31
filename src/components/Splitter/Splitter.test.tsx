import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, keepMotion } from '../../../tools/test/vitest/helpers';
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

const modified = (t: Element, key = 'ArrowRight') => ['altKey', 'ctrlKey', 'metaKey'].map((m) => { const ev = new KeyboardEvent('keydown', { key, [m]: true, bubbles: true, cancelable: true }); t.dispatchEvent(ev); return ev.defaultPrevented; });

describe('Splitter', () => {
  test('your onKeyDown on the Splitter runs as keys bubble up, after the controls inside: one that stops propagation (to keep keys from page shortcuts) leaves them working (GR57)', async () => {
    const seen: string[] = [];
    await render(<Splitter id="gr" style={{ width: '408px', height: '200px' }} onKeyDown={(e) => { seen.push('splitter:' + e.defaultPrevented); e.stopPropagation(); }}>
      <div><input id="gri" aria-label="Note" onKeyDown={(e) => { seen.push('input:' + e.key); }} /></div>
      <div>B</div>
    </Splitter>);
    (document.getElementById('gri') as HTMLInputElement).focus();
    await userEvent.keyboard('a');
    const sep = document.querySelector('#gr [role=separator]') as HTMLElement;
    sep.focus();
    const before = sep.getAttribute('aria-valuenow');
    await userEvent.keyboard('{ArrowRight}');
    expect([seen, (document.getElementById('gri') as HTMLInputElement).value, sep.getAttribute('aria-valuenow') !== before]).toEqual([['input:a', 'splitter:false', 'splitter:true'], 'a', true]);
  });

  test('with Alt, Ctrl or ⌘ the arrow keys are left to the browser (Alt+← goes back a page) (L8E28)', async () => {
    await render(<Two />);
    const t = document.querySelector('[role=separator]') as HTMLElement;
    t.focus();
    const before = t.getAttribute('aria-valuenow');
    expect([modified(t), modified(t, 'ArrowLeft'), document.activeElement === t, t.getAttribute('aria-valuenow') === before]).toEqual([[false, false, false], [false, false, false], true, true]);
  });

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

  test('keyboard table: Tab reaches the handle between the first pane\'s content and the second\'s (FH1)', async () => {
    await render(<Two />);
    el('nav').querySelector('a')!.focus();
    await userEvent.tab();
    const at = document.activeElement === handle('s');
    await userEvent.tab();
    expect([at, document.activeElement?.textContent]).toEqual([true, 'Reply']);
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

  test('a parent collapsing the first pane while focus is in it moves focus to the handle, not the page (GN3)', async () => {
    let set: (n: number) => void = () => {};
    function Parent() { const [n, s] = React.useState(40); set = s; return <Splitter id="gn3" collapsible size={n} onSizeChange={s} style={{ width: '400px', height: '80px' }}><div><button id="gn3-in">In the pane</button></div><p>B</p></Splitter>; }
    await render(<Parent />);
    document.getElementById('gn3-in')!.focus();
    React.act(() => set(0));
    await expect.poll(() => document.activeElement === handle('gn3')).toBe(true);
    expect(first('gn3').hidden).toBe(true);
    React.act(() => set(40));
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

  test('a press on the handle without dragging, then a press elsewhere in the Splitter, puts the handle there (2.5.7, FG1); that press doesn\'t reach what\'s under it; the handle again or Escape cancels', async () => {
    const clicks: string[] = [];
    await render(<div onClick={(e) => clicks.push((e.target as HTMLElement).textContent || '')}><Two /></div>);
    const box = el('s').getBoundingClientRect(), reply = el('main').querySelector('button')!;
    await userEvent.click(handle('s'));
    await expect.poll(() => document.querySelector('[data-dk-announcer]')?.textContent).toBe('Press where the handle should go, or press the handle again to cancel.');
    expect([el('s').hasAttribute('data-placing'), now('s')]).toEqual([true, 50]);
    const r = reply.getBoundingClientRect(), want = Math.round((r.left + 4 - box.left) / box.width * 100);
    await userEvent.click(reply, { position: { x: 4, y: 4 } });
    expect([el('s').hasAttribute('data-placing'), now('s'), clicks.filter((c) => c === 'Reply'), document.activeElement === handle('s')]).toEqual([false, want, [], true]);
    await userEvent.click(reply);
    expect(clicks.filter((c) => c === 'Reply')).toEqual(['Reply']);   // placed once; the next press is the button's
    await userEvent.click(handle('s'));
    await userEvent.click(handle('s'));
    expect(el('s').hasAttribute('data-placing')).toBe(false);
    await userEvent.click(handle('s'));
    await userEvent.keyboard('{Escape}');
    expect([el('s').hasAttribute('data-placing'), now('s')]).toEqual([false, want]);
  });

  test('a pane whose content overflows takes Tab focus so it scrolls from the keyboard (2.1.1); one that fits doesn\'t', async () => {
    await render(<Splitter id="s" style={{ width: '408px', height: '120px' }}>
      <div id="long" style={{ height: '400px' }}>Every message</div>
      <div id="short">One line</div>
    </Splitter>);
    const [a, b] = [el('long').parentElement!, el('short').parentElement!];
    await expect.poll(() => a.tabIndex).toBe(0);
    expect(b.hasAttribute('tabindex')).toBe(false);
    await userEvent.tab();
    expect(document.activeElement).toBe(a);
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

describe('Splitter collapse motion (GN3b)', () => {
  keepMotion();
  test('Enter slides the first pane out and back: the layout changes at once, the handle and second pane slide on translate and the first pane\'s clip with them; a drag doesn\'t slide', async () => {
    await render(<Splitter id="m" collapsible defaultSize={40} style={{ width: '500px', height: '80px' }}><p>A</p><p>B</p></Splitter>);
    const root = document.getElementById('m')!, [a, h] = [...root.children] as HTMLElement[];
    const ran: string[] = [];
    root.addEventListener('transitionrun', (ev) => { const t = ev.target as HTMLElement; if (t.parentElement === root && !ev.pseudoElement) ran.push([...t.classList].pop()!.replace('dk-splitter__', '') + ' ' + ev.propertyName); });
    h.focus();
    await userEvent.keyboard('{Enter}');
    // Closing: already laid out collapsed (the handle at the start), while the first pane stays over its old place, inert.
    expect([h.getAttribute('aria-valuenow'), Math.round(h.offsetLeft), a.hidden, a.inert, Math.round(a.offsetWidth)]).toEqual(['0', 0, false, true, 200]);
    await expect.poll(() => root.hasAttribute('data-slide'), { timeout: 2000 }).toBe(false);
    expect([a.hidden, document.activeElement === h]).toEqual([true, true]);
    await userEvent.keyboard('{Enter}');
    expect([h.getAttribute('aria-valuenow'), a.hidden, a.inert]).toEqual(['40', false, false]);
    await expect.poll(() => root.hasAttribute('data-slide'), { timeout: 2000 }).toBe(false);
    expect([...new Set(ran)].sort()).toEqual(['handle translate', 'pane--first clip-path', 'pane--second translate']);
    ran.length = 0;
    await userEvent.keyboard('{ArrowRight}');
    await new Promise((r) => setTimeout(r, 50));
    expect([h.getAttribute('aria-valuenow'), ran, root.hasAttribute('data-slide')]).toEqual(['45', [], false]);   // a step doesn't slide
  });

  test('Enter again mid-way turns the slide back from where the handle is, with the first pane\'s clip at the same place, not from either end (GR46)', async () => {
    await render(<Splitter id="mr" collapsible defaultSize={40} style={{ width: '500px', height: '80px' }}><p>A</p><p>B</p></Splitter>);
    const root = document.getElementById('mr')!, [a, h] = [...root.children] as HTMLElement[];
    const x = () => Math.round(h.getBoundingClientRect().left - root.getBoundingClientRect().left);
    // Holds every running slide half way, as if Enter came again in the middle of it.
    const halfway = async () => {
      await expect.poll(() => root.getAttribute('data-slide') === 'run' && h.getAnimations().length > 0, { timeout: 2000 }).toBe(true);
      for (const an of root.getAnimations({ subtree: true })) { an.pause(); an.currentTime = Number(an.effect!.getTiming().duration) / 2; }
      return x();
    };
    h.focus();
    await userEvent.keyboard('{Enter}');
    const closingAt = await halfway();
    expect(closingAt > 20 && closingAt < 180, String(closingAt)).toBe(true);
    await userEvent.keyboard('{Enter}');
    // Opening again: laid out open at once, but the handle is still where it was, and the clip hides the same part.
    expect([h.getAttribute('aria-valuenow'), root.getAttribute('data-slide-to'), Math.abs(x() - closingAt) <= 2]).toEqual(['40', 'open', true]);
    expect(getComputedStyle(a).clipPath).toBe('inset(0px ' + (200 - closingAt) + 'px 0px 0px)');
    const openingAt = await halfway();
    expect(openingAt > closingAt && openingAt < 200, String(openingAt)).toBe(true);
    // …and back again: from there toward the start.
    await userEvent.keyboard('{Enter}');
    expect([h.getAttribute('aria-valuenow'), root.getAttribute('data-slide-to'), Math.abs(x() - openingAt) <= 2, Math.round(h.offsetLeft)]).toEqual(['0', 'closed', true, 0]);
    for (const an of root.getAnimations({ subtree: true })) an.finish();
    await expect.poll(() => root.hasAttribute('data-slide'), { timeout: 2000 }).toBe(false);
    expect([x(), a.hidden]).toEqual([0, true]);
  });
});
