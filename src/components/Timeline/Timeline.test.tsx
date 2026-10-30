import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Timeline, TimelineItem } from './Timeline';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const rect = (e: Element) => e.getBoundingClientRect();
const q = (root: Element, sel: string) => root.querySelector(sel) as HTMLElement;

function Order(p: { align?: 'start' | 'alternate' }) {
  return <Timeline id="tl" aria-label="Order history" align={p.align}>
    <TimelineItem id="a" title="Order placed" time="12 Mar" dateTime="2026-03-12" status="success" icon="check">Two items.</TimelineItem>
    <TimelineItem id="b" title="Delivery delayed" time="13 Mar" status="warning" />
    <TimelineItem id="c" title="Out for delivery" time="15 Mar" />
  </Timeline>;
}

describe('Timeline', () => {
  test('renders an <ol> of <li>s; ref, className and other props reach them', async () => {
    const ref = React.createRef<HTMLOListElement>();
    const iref = React.createRef<HTMLLIElement>();
    await render(<Timeline id="x" ref={ref} className="extra" data-x="y"><TimelineItem id="i" ref={iref} className="mine" data-y="z" title="One" /></Timeline>);
    const e = el('x');
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['OL', true, 'dk-timeline extra', 'y', 'timeline']);
    expect([el('i').tagName, iref.current === el('i'), el('i').classList.contains('mine'), el('i').dataset.y]).toEqual(['LI', true, true, 'z']);
  });

  test('a list named by aria-label, with each event\'s title, a <time> with dateTime, and the content; the marker is hidden', async () => {
    await render(<Order />);
    await expect.element(page.getByRole('list', { name: 'Order history' })).toBeInTheDocument();
    expect(page.getByRole('listitem').all().length).toBe(3);
    const t = q(el('a'), 'time');
    expect([t.textContent, t.getAttribute('dateTime'), q(el('a'), '.dk-timeline__content').textContent]).toEqual(['12 Mar', '2026-03-12', 'Two items.']);
    expect([el('a').textContent, q(el('a'), '.dk-timeline__rail').getAttribute('aria-hidden')]).toEqual(['Order placed12 MarTwo items.', 'true']);
    // Without children there is no content box; without time, no <time>.
    await render(<Timeline><TimelineItem id="bare" title="Bare" /></Timeline>);
    expect([el('bare').querySelector('time'), q(el('bare'), '.dk-timeline__content')]).toEqual([null, null]);
  });

  test('the line joins each marker to the next, and the last has none; the title\'s first line sits level with the marker', async () => {
    await render(<Order />);
    const line = (id: string) => getComputedStyle(q(el(id), '.dk-timeline__rail'), '::after');
    expect([line('a').visibility, line('a').width, line('c').visibility]).toEqual(['visible', '2px', 'hidden']);
    const m = rect(q(el('b'), '.dk-timeline__marker')), title = rect(q(el('b'), '.dk-timeline__title'));
    expect([m.width, m.height, Math.round(title.top - m.top), Math.round(title.height)]).toEqual([24, 24, 0, 24]);
    // The rail of the first item reaches down to the second item's top.
    expect(Math.round(rect(q(el('a'), '.dk-timeline__rail')).bottom)).toBe(Math.round(rect(el('b')).top));
  });

  test('status colors the dot, or tints an icon\'s circle; unknown values fall back to neutral', async () => {
    await render(<Timeline><TimelineItem id="s" title="S" status="danger" /><TimelineItem id="n" title="N" status={'bogus' as 'info'} /><TimelineItem id="ic" title="I" icon="check" status="success" /></Timeline>);
    const dot = (id: string) => getComputedStyle(q(el(id), '.dk-timeline__marker'), '::before').backgroundColor;
    expect([el('s').classList.contains('dk-timeline__item--danger'), el('n').classList.contains('dk-timeline__item--neutral')]).toEqual([true, true]);
    expect(dot('s')).not.toBe(dot('n'));
    const ic = q(el('ic'), '.dk-timeline__marker');
    expect([getComputedStyle(ic, '::before').content, q(ic, '.dk-icon') !== null, css(ic).backgroundColor !== 'rgba(0, 0, 0, 0)']).toEqual(['none', true, true]);
  });

  test('align="alternate": from 768px up the rail is centered and bodies take turns; narrower they stay on one side', async () => {
    const w = window.innerWidth, h = window.innerHeight;
    try {
      await page.viewport(1000, 700);
      await render(<div style={{ width: '800px' }}><Order align="alternate" /></div>);
      const tl = rect(el('tl')), rail = rect(q(el('a'), '.dk-timeline__rail'));
      expect(Math.abs((rail.left + rail.right) / 2 - (tl.left + tl.right) / 2)).toBeLessThan(1);
      expect([rect(q(el('a'), '.dk-timeline__body')).left > rail.right, rect(q(el('b'), '.dk-timeline__body')).right <= rect(q(el('b'), '.dk-timeline__rail')).left]).toEqual([true, true]);
      expect(css(q(el('b'), '.dk-timeline__body')).textAlign).toBe('end');
      await page.viewport(500, 700);
      await expect.poll(() => rect(q(el('b'), '.dk-timeline__body')).left > rect(q(el('b'), '.dk-timeline__rail')).right).toBe(true);
    } finally { await page.viewport(w, h); }
  });

  test('right to left: the rail is on the right', async () => {
    await render(<div dir="rtl"><Order /></div>);
    expect(rect(q(el('a'), '.dk-timeline__rail')).left > rect(q(el('a'), '.dk-timeline__body')).right).toBe(true);
  });

  test('titles, times and content read 4.5:1 on the page in all six themes', async () => {
    await render(<Order />);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const bg = css(document.body).backgroundColor;
      for (const sel of ['.dk-timeline__title', '.dk-timeline__time', '.dk-timeline__content']) expect(contrast(css(q(el('a'), sel)).color, bg), th + sel).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('an icon reads 3:1 on its circle, for every status in all six themes', async () => {
    const all = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;
    await render(<Timeline>{all.map((st) => <TimelineItem key={st} id={'i-' + st} title={st} icon="check" status={st} />)}</Timeline>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const st of all) { const m = q(el('i-' + st), '.dk-timeline__marker'); expect(contrast(css(m).color, css(m).backgroundColor), th + ' ' + st).toBeGreaterThanOrEqual(3); }
    }
  });

  test('a word longer than the body wraps, so at 320px the page doesn\'t scroll sideways (RF1, WCAG 1.4.10)', async () => {
    await page.viewport(320, 640);
    await render(<div id="box" style={{ width: '240px' }}><Timeline aria-label="Order history">
      <TimelineItem id="lw" title="Donaudampfschifffahrtsgesellschaftskapitänskajüte" time="12 Mar" icon="schedule">Two items. Donaudampfschifffahrtsgesellschaftskapitänskajüte.</TimelineItem>
    </Timeline></div>);
    const body = q(el('lw'), '.dk-timeline__body');
    expect([el('box').scrollWidth <= 241, body.scrollWidth <= body.clientWidth + 1, rect(body).right <= rect(el('box')).right + 1]).toEqual([true, true, true]);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  });
});
