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
const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// A list that loads `step` more per press, up to `all`, each load taking `ms`.
function Paged({ id = 'lm', step = 10, all = 30, ms = 50, infinite = false, onLoad = () => {} }: { id?: string; step?: number; all?: number; ms?: number; infinite?: boolean; onLoad?: () => void }) {
  const [n, setN] = React.useState(step);
  const load = () => { onLoad(); return new Promise<void>((done) => setTimeout(() => { setN((x) => Math.min(x + step, all)); done(); }, ms)); };
  return <div><ul>{Array.from({ length: n }, (_, i) => <li key={i}>Item {i + 1}</li>)}</ul><LoadMore id={id} onLoadMore={load} count={n} total={all} hasMore={n < all} infinite={infinite} /></div>;
}

describe('LoadMore', () => {
  test('a <div> with "Showing 20 of 134" over an outline Load more button; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<LoadMore id="x" ref={ref} className="extra" data-x="y" onLoadMore={() => {}} count={20} total={1340} />);
    const e = el('x');
    expect([e.tagName, ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['DIV', true, 'dk-load-more extra', 'y', 'load-more']);
    expect([e.querySelector('.dk-load-more__summary')!.textContent, button('x').textContent, button('x').className.includes('dk-btn--outline')]).toEqual(['Showing 20 of 1,340', 'Load more', true]);
  });

  test('pressing it loads (one press until the promise settles), says what was added, keeps focus on the button, and focuses the end text when the last page leaves no button', async () => {
    await expect.poll(announcerIdle, { timeout: 3000 }).toBe(true);
    let loads = 0;
    await render(<><button id="before">Before</button><Paged onLoad={() => loads++} /></>);
    el('before').focus();
    await userEvent.tab();   // past the list's items, which aren't focusable, to the button
    expect(document.activeElement).toBe(button('lm'));
    await userEvent.keyboard('{Enter}');
    button('lm').click();
    expect([loads, button('lm').getAttribute('aria-busy')]).toEqual([1, 'true']);
    await expect.poll(() => region().textContent, { timeout: 3000 }).toBe('10 more loaded. Showing 20 of 30.');
    expect(document.activeElement).toBe(button('lm'));
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => el('lm').querySelector('.dk-load-more__end') !== null, { timeout: 3000 }).toBe(true);
    const end = el('lm').querySelector('.dk-load-more__end') as HTMLElement;
    expect([end.textContent, document.activeElement === end, loads]).toEqual(['You’ve reached the end', true, 2]);
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
    await expect.poll(() => el('inf').querySelector('.dk-load-more__end') !== null, { timeout: 3000 }).toBe(true);
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
    await render(<SerupaProvider labels={idLabels}><LoadMore id="id" onLoadMore={() => {}} count={20} total={134} /><LoadMore id="id2" onLoadMore={() => {}} hasMore={false} /></SerupaProvider>);
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
