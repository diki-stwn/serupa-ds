import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { LoadMore } from './LoadMore';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const button = (id: string) => el(id).querySelector('button') as HTMLButtonElement;
const region = () => document.querySelector('[data-dk-announcer]') as HTMLElement;
// The end text and the summary, found by what they say.
const para = (id: string, text: string) => [...el(id).querySelectorAll('p')].find((p) => p.textContent === text) ?? null;
const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// A list that loads `step` more per press, up to `all`, each load taking `ms`.
function Paged({ id = 'lm', step = 10, all = 30, ms = 50, infinite = false, onLoad = () => {}, endText }: { id?: string; step?: number; all?: number; ms?: number; infinite?: boolean; onLoad?: () => void; endText?: React.ReactNode }) {
  const [n, setN] = React.useState(step);
  const load = () => { onLoad(); return new Promise<void>((done) => setTimeout(() => { setN((x) => Math.min(x + step, all)); done(); }, ms)); };
  return <div><ul>{Array.from({ length: n }, (_, i) => <li key={i}>Item {i + 1}</li>)}</ul><LoadMore id={id} onLoadMore={load} count={n} total={all} hasMore={n < all} infinite={infinite} endText={endText} /></div>;
}

describe('LoadMore', () => {
  test('a <div> with "Showing 20 of 134" over an outline Load more button; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<SerupaProvider locale="en-US"><LoadMore id="x" ref={ref} className="extra" data-x="y" onLoadMore={() => {}} count={20} total={1340} /></SerupaProvider>);   // pinned: 1,340 follows the browser's locale
    const e = el('x');
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['DIV', true, 'dk-load-more extra', 'y', 'load-more']);
    expect([para('x', 'Showing 20 of 1,340')?.textContent, button('x').textContent, button('x').className.includes('dk-btn--outline')]).toEqual(['Showing 20 of 1,340', 'Load more', true]);
  });

  test('pressing it loads (one press until the promise settles), says what was added, keeps focus on the button, and focuses the end text when the last page leaves no button', async () => {
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    let loads = 0;
    await render(<SerupaProvider locale="en-US"><button id="before">Before</button><Paged onLoad={() => loads++} /></SerupaProvider>);
    el('before').focus();
    await userEvent.tab();   // past the list's items, which aren't focusable, to the button
    expect(document.activeElement).toBe(button('lm'));
    await userEvent.keyboard('{Enter}');
    button('lm').click();
    expect([loads, button('lm').getAttribute('aria-busy')]).toEqual([1, 'true']);
    await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('10 more loaded. Showing 20 of 30.');
    expect(document.activeElement).toBe(button('lm'));
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => para('lm', 'You’ve reached the end') !== null, { timeout: 3000 }).toBe(true);
    const end = para('lm', 'You’ve reached the end')!;
    // Focus moves in an effect after the commit that shows the end text, so WebKit can show the text a beat first.
    await expect.poll(() => document.activeElement === end, { timeout: 3000 }).toBe(true);
    expect([end.textContent, loads]).toEqual(['You’ve reached the end', 2]);
  });

  test('L8E38: with endText={null}, the last page focuses the summary, so focus isn\'t lost to the page', async () => {
    await render(<SerupaProvider locale="en-US"><Paged id="nt" step={10} all={20} endText={null} /></SerupaProvider>);
    button('nt').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('nt').querySelector('button') === null, { timeout: 3000 }).toBe(true);
    const sum = para('nt', 'Showing 20 of 20')!;
    await expect.poll(() => document.activeElement === sum, { timeout: 3000 }).toBe(true);
    expect(sum.tabIndex).toBe(-1);
  });

  test('inside a shadow root, the last page focuses the end text too, not the page (GR90)', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(inner);
    try {
      await render(<SerupaProvider locale="en-US"><Paged id="sh" step={10} all={20} /></SerupaProvider>, { container: inner });
      const root = host.shadowRoot!;
      root.querySelector<HTMLElement>('#sh button')!.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => root.activeElement?.textContent, { timeout: 3000 }).toBe('You’ve reached the end');
    } finally { host.remove(); }
  });

  test('with endText={null} and no summary, the last page leaves focus on LoadMore itself, not the page; it isn\'t a tab stop after (L8E58)', async () => {
    function Bare() {
      const [more, setMore] = React.useState(true);
      return <><button id="lm-before">Before</button><LoadMore id="bare" onLoadMore={() => setMore(false)} hasMore={more} endText={null} /></>;
    }
    await render(<Bare />);
    button('bare').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('bare').querySelector('button')).toBe(null);
    await expect.poll(() => document.activeElement).toBe(el('bare'));
    await userEvent.tab({ shift: true });
    expect([document.activeElement, el('bare').hasAttribute('tabindex')]).toEqual([el('lm-before'), false]);
  });

  test('without count, "More loaded" once the load settles; endText null shows nothing at the end; label replaces the words', async () => {
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    await render(<>
      <LoadMore id="a" onLoadMore={() => wait(20)} label="Show 20 more" />
      <LoadMore id="b" onLoadMore={() => {}} hasMore={false} endText={null} />
    </>);
    expect([button('a').textContent, el('b').childElementCount]).toEqual(['Show 20 more', 0]);
    button('a').click();
    await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('More loaded');
  });

  test('infinite: loads as it nears the viewport, again only after count changes, and not past the end', async () => {
    let loads = 0;
    await render(<div style={{ height: 120, overflow: 'auto' }}><Paged id="inf" step={2} all={6} infinite onLoad={() => loads++} /></div>);
    await expect.poll(() => para('inf', 'You’ve reached the end') !== null, { timeout: 3000 }).toBe(true);
    await wait(200);
    expect(loads).toBe(2);
  });

  test('infinite: a load that adds nothing isn\'t retried on its own', async () => {
    let loads = 0;
    await render(<LoadMore id="stuck" infinite count={5} total={10} onLoadMore={() => { loads++; return wait(10); }} />);
    await wait(300);
    expect(loads).toBe(1);
    button('stuck').click();
    expect(loads).toBe(2);
  });

  test('Indonesian labels from the provider', async () => {
    await render(<SerupaProvider labels={idLabels} locale="id-ID"><LoadMore id="id" onLoadMore={() => {}} count={20} total={134} /><LoadMore id="id2" onLoadMore={() => {}} hasMore={false} /></SerupaProvider>);
    expect([el('id').textContent, el('id2').textContent]).toEqual(['Menampilkan 20 dari 134Muat lagi', 'Sudah sampai akhir']);
  });

  test('the summary and end text read 4.5:1 on the page in all six themes', async () => {
    await render(<div id="bg" style={{ background: 'var(--surface)' }}><LoadMore id="c" onLoadMore={() => {}} count={1} total={2} /><LoadMore id="d" onLoadMore={() => {}} hasMore={false} /></div>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      for (const p of [el('c').querySelector('p')!, el('d').querySelector('p')!]) expect(contrast(css(p).color, css(el('bg')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('LoadMore at 320px (GR1)', () => {
  test('a long label wraps onto more lines inside the box, in a block and in a grid column, instead of being cut off', async () => {
    const label = 'Show the next twenty invoices from the archive';
    await render(<div id="gr1" style={{ width: '320px' }}>
      <LoadMore id="gr1-b" onLoadMore={() => {}} label={label} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}><LoadMore id="gr1-g" onLoadMore={() => {}} label={label} /></div>
    </div>);
    for (const id of ['gr1-b', 'gr1-g']) {
      const b = button(id), text = b.querySelector('span') ?? b;
      expect([b.textContent, b.getBoundingClientRect().width <= 320, text.scrollWidth <= text.clientWidth]).toEqual([label, true, true]);
    }
    expect(el('gr1').scrollWidth).toBe(320);
  });
});

describe('LoadMore after a keyboard load (GR2)', () => {
  test('the focused button, pushed down by the new items, is scrolled back into view once they land', async () => {
    await render(<SerupaProvider locale="en-US"><div id="gr2" style={{ height: '300px', overflow: 'auto' }}><Paged id="gr2-lm" step={20} all={60} /></div></SerupaProvider>);
    const box = el('gr2');
    box.scrollTop = box.scrollHeight;
    button('gr2-lm').focus();
    const seen = () => { const b = button('gr2-lm').getBoundingClientRect(), v = box.getBoundingClientRect(); return b.top >= v.top - 0.5 && b.bottom <= v.bottom + 0.5; };
    expect(seen()).toBe(true);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('gr2-lm').parentElement!.querySelectorAll('li').length, { timeout: 3000 }).toBe(40);
    await expect.poll(seen, { timeout: 3000 }).toBe(true);
    expect(document.activeElement).toBe(button('gr2-lm'));
  });
});
