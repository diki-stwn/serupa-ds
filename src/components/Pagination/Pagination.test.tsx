import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press, iconPoints } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { idLabels } from '../../internal/labels';
import { Pagination, paginationRange } from './Pagination';

// The tests that read digits say they mean en-US: with no locale, a count is in the browser's digits ("٣" in ar-EG).
const EnUS = ({ children }: { children: React.ReactNode }) => <SerupaProvider locale="en-US">{children}</SerupaProvider>;

const el = (id: string) => document.getElementById(id) as HTMLElement;
const q = (id: string, sel: string) => el(id).querySelector(sel) as HTMLElement;
const named = (id: string, name: string) => q(id, `[aria-label="${name}"]`);
// The row as text: "(<)" a disabled arrow, "<" ">" live arrows, "[n]" the current page, "…" a gap.
const shown = (id: string) => [...el(id).querySelectorAll('li')].map((li) => {
  const e = li.firstElementChild as HTMLButtonElement | null;
  if (!e) return li.textContent;
  if (e.classList.contains('dk-pagination__arrow')) {
    const dir = li.previousElementSibling ? '>' : '<';
    return e.disabled || e.getAttribute('aria-disabled') ? `(${dir})` : dir;
  }
  return e.getAttribute('aria-current') ? `[${e.textContent}]` : e.textContent;
}).join(' ');

let errors: MockInstance<typeof console.error>;
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});
beforeEach(() => { errors = vi.spyOn(console, 'error'); });

describe('Pagination', () => {
  test('paginationRange: boundaries, siblings and … keep seven slots; short ranges show every page', () => {
    const f = (a: ReturnType<typeof paginationRange>) => a.map((x) => typeof x === 'number' ? x : '…').join(' ');
    expect([f(paginationRange(1, 10)), f(paginationRange(5, 10)), f(paginationRange(10, 10)), f(paginationRange(4, 10)), f(paginationRange(1, 5)),
      f(paginationRange(2, 1)), f(paginationRange(1, 0)), f(paginationRange(10, 20, 2, 2))]).toEqual([
      '1 2 3 4 5 … 10', '1 … 4 5 6 … 10', '1 … 6 7 8 9 10', '1 2 3 4 5 … 10', '1 2 3 4 5', '1', '', '1 2 … 8 9 10 11 12 … 19 20',
    ]);
  });

  test('page numbers are written in the digits of the locale, as Calendar writes its days; the buttons keep their names', async () => {
    await render(<>
      <SerupaProvider locale="ar-EG"><Pagination id="par" count={10} page={5} /></SerupaProvider>
      <SerupaProvider locale="fa"><Pagination id="pfa" count={3} page={2} /></SerupaProvider>
    </>);
    const d = (l: string, n: number) => new Intl.NumberFormat(l).format(n);
    expect(shown('par')).toBe(`< ${d('ar-EG', 1)} … ${d('ar-EG', 4)} [${d('ar-EG', 5)}] ${d('ar-EG', 6)} … ${d('ar-EG', 10)} >`);
    expect([shown('par').includes('٥'), shown('pfa')]).toEqual([true, '< ۱ [۲] ۳ >']);
    expect(named('par', 'Page 5').getAttribute('aria-current')).toBe('page');
  });

  test('a <nav aria-label="Pagination"> with a list; ref, className and props reach the nav; buttons are named and the ellipsis is hidden', async () => {
    const ref = React.createRef<HTMLElement>();
    await render(<Pagination id="pdef" count={10} ref={ref} className="extra" data-x="y" />);
    const n = el('pdef');
    expect([n.tagName, n.getAttribute('aria-label'), n.className, n.dataset.component, ref.current === n, n.dataset.x, n.firstElementChild!.tagName])
      .toEqual(['NAV', 'Pagination', 'dk-pagination extra', 'pagination', true, 'y', 'UL']);
    expect([...n.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')).join())
      .toBe('Previous page,Page 1,Page 2,Page 3,Page 4,Page 5,Page 10,Next page');
    expect(q('pdef', '.dk-pagination__ellipsis').getAttribute('aria-hidden')).toBe('true');
  });

  test('uncontrolled: starts on page 1 with previous disabled; clicking a page moves there; next moves one page on', async () => {
    await render(<Pagination id="pdef" count={10} />, { wrapper: EnUS });
    expect(shown('pdef')).toBe('(<) [1] 2 3 4 5 … 10 >');
    await userEvent.click(named('pdef', 'Page 5'));
    expect(shown('pdef')).toBe('< 1 … 4 [5] 6 … 10 >');
    await userEvent.click(named('pdef', 'Next page'));
    // Settled before the second click: in Firefox, one that lands mid-update can be lost.
    await expect.poll(() => shown('pdef')).toBe('< 1 … 5 [6] 7 … 10 >');
    await userEvent.click(named('pdef', 'Next page'));
    await expect.poll(() => shown('pdef')).toBe('< 1 … 6 [7] 8 9 10 >');
  });

  test('controlled: onPageChange gets the page and the parent sets it; clicking the current page does nothing; without updating it stays on its page', async () => {
    const calls: Array<number | string> = [];
    function Controlled() {
      const [p, setP] = React.useState(5);
      return <Pagination id="pc" count={10} page={p} onPageChange={(n) => { calls.push(n); setP(n); }} />;
    }
    await render(<><Controlled /><Pagination id="pfixed" count={10} page={3} onPageChange={(n) => { calls.push('fixed' + n); }} /></>, { wrapper: EnUS });
    await userEvent.click(named('pc', 'Previous page'));
    expect(shown('pc')).toBe('< 1 2 3 [4] 5 … 10 >');
    expect(calls.join()).toBe('4');
    await userEvent.click(q('pc', '[aria-current]'));
    expect(calls.join()).toBe('4');
    await userEvent.click(named('pfixed', 'Page 4'));
    expect(shown('pfixed')).toBe('< 1 2 [3] 4 5 … 10 >');
    expect(calls.join()).toBe('4,fixed4');
  });

  test('getHref: pages are links with your labels and rel prev/next; the next link at the end has no href and aria-disabled; a click follows the link and moves the page', async () => {
    await render(<Pagination id="plink" count={20} defaultPage={20} getHref={(n) => '#page-' + n} previousLabel="Newer" nextLabel="Older"
      pageLabel={(n) => 'Go to ' + n} aria-label="Results" />, { wrapper: EnUS });
    const n = el('plink');
    expect(n.getAttribute('aria-label')).toBe('Results');
    expect([...n.querySelectorAll('a')].map((a) => [a.getAttribute('aria-label'), a.getAttribute('href'), a.getAttribute('aria-disabled'), a.getAttribute('rel')].join(':')).join(' '))
      .toBe('Newer:#page-19::prev Go to 1:#page-1:: Go to 16:#page-16:: Go to 17:#page-17:: Go to 18:#page-18:: Go to 19:#page-19:: Go to 20:#page-20:: Older::true:next');
    await userEvent.click(named('plink', 'Go to 18'));
    expect(location.hash).toBe('#page-18');
    expect(shown('plink')).toContain('[18]');
    history.replaceState(null, '', location.pathname + location.search);
  });

  test('keyboard: Tab to a page and Enter picks it; keyboard focus shows a 2px ring', async () => {
    await render(<Pagination id="psm" count={3} size="sm" />, { wrapper: EnUS });
    named('psm', 'Page 1').focus();
    await userEvent.keyboard('{Tab}{Enter}');
    expect(shown('psm')).toBe('< 1 [2] 3 >');
    expect(css(named('psm', 'Page 3')).outlineStyle).toBe('none');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(named('psm', 'Page 3'));
    expect([css(named('psm', 'Page 3')).outlineStyle, css(named('psm', 'Page 3')).outlineWidth]).toEqual(['solid', '2px']);
  });

  test('size md is 32px square, sm 24px; the current page is primary with on-primary text, semibold', async () => {
    // Also in DejaVu Sans, where Inter isn't installed (CI's runners): its "1" is 8.36px, which made a 24.36px page
    // when sm kept md's 8px sides. And with the widest digits, two of them.
    await render(<><Pagination id="pdef" count={10} /><Pagination id="psm" count={3} size="sm" /><div style={{ fontFamily: '"DejaVu Sans"' }}><Pagination id="pdv" count={3} size="sm" /><Pagination id="p88" count={88} page={88} size="sm" siblings={0} /></div></>);
    const sq = (id: string, page = 'Page 1') => { const r = named(id, page).getBoundingClientRect(); return r.width + 'x' + r.height; };
    expect([sq('pdef'), sq('psm'), sq('pdv'), sq('p88', 'Page 88')]).toEqual(['32x32', '24x24', '24x24', '24x24']);
    const cur = q('pdef', '[aria-current]');
    // The page buttons ease their background for 150ms.
    await expect.poll(() => css(cur).backgroundColor).toBe(color('var(--primary)'));
    expect([css(cur).color, css(cur).fontWeight]).toEqual([color('var(--on-primary)'), '600']);
  });

  test('arrows with nowhere to go fade to 50%; a bad count, page, size and siblings fall back: no pages, both arrows disabled', async () => {
    // @ts-expect-error: an unknown size, as plain JavaScript could pass
    await render(<Pagination id="pbad" count={-4} defaultPage={99} size="xl" siblings={-1} />);
    const s = css(named('pbad', 'Previous page'));
    expect([s.opacity, s.cursor]).toEqual(['0.5', 'not-allowed']);
    expect(shown('pbad')).toBe('(<) (>)');
    expect(el('pbad').className).toBe('dk-pagination');
  });

  test('the row stays on one line: in 320px the defaults drop siblings, then boundaries, until it fits; with room again they come back (ET1)', async () => {
    const Box = ({ w }: { w: number }) => <div style={{ width: w + 'px' }}><Pagination id="fit" count={20} defaultPage={10} /></div>;
    const s = await render(<Box w={600} />, { wrapper: EnUS });
    const fits = () => { const l = q('fit', 'ul'), a = [named('fit', 'Previous page'), named('fit', 'Next page')].map((x) => x.getBoundingClientRect()); return l.scrollWidth <= l.clientWidth && a[0].top === a[1].top && a[1].right <= l.getBoundingClientRect().right + 0.5; };
    expect([shown('fit'), fits()]).toEqual(['< 1 … 9 [10] 11 … 20 >', true]);
    await s.rerender(<Box w={320} />);
    await vi.waitFor(() => expect(fits()).toBe(true));
    const narrow = shown('fit');
    expect(narrow).toContain('[10]');
    expect(narrow.split(' ').length).toBeLessThan(9);
    await s.rerender(<Box w={200} />);
    await vi.waitFor(() => expect(shown('fit')).toBe('< … [10] … >'));
    await s.rerender(<Box w={600} />);
    await vi.waitFor(() => expect(shown('fit')).toBe('< 1 … 9 [10] 11 … 20 >'));
    // A shrink and a grow back in the same frame, before any resize is reported, still end with the full row.
    await s.rerender(<Box w={200} />);
    await s.rerender(<Box w={600} />);
    await vi.waitFor(() => expect(shown('fit')).toBe('< 1 … 9 [10] 11 … 20 >'));
  });

  test('right to left: the arrows point the other way', async () => {
    await render(<div dir="rtl"><Pagination id="prtl" count={3} /></div>);
    expect([...el('prtl').querySelectorAll('.dk-pagination__arrow')].map((a) => iconPoints(a.querySelector('[data-icon]')!)).join()).toBe('right,left');
  });

  test('Pagination tokens (--pagination-current-bg, --pagination-size) override one pagination', async () => {
    await render(<Pagination id="ptok" count={3} style={{ '--pagination-current-bg': 'rgb(1, 2, 3)', '--pagination-size': '40px' } as React.CSSProperties} />);
    const e = q('ptok', '[aria-current]');
    await expect.poll(() => css(e).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(e.getBoundingClientRect().height).toBe(40);
  });

  test('contrast: pages (also on hover), the current page and the ellipsis keep 4.5:1 in all six themes', async () => {
    // On page 7, as the script left it: page 1 is a plain page and there is an ellipsis.
    await render(<Pagination id="pdef" count={10} defaultPage={7} />);
    const pg = named('pdef', 'Page 1'), cur = q('pdef', '[aria-current]'), ell = q('pdef', '.dk-pagination__ellipsis');
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // Colors ease for 150ms after a theme change; wait until the current page has its new background.
      await expect.poll(() => css(cur).backgroundColor).toBe(color('var(--primary)'));
      for (const [name, fg, bg] of [['page', css(pg).color, 'var(--surface)'], ['page on hover', css(pg).color, 'var(--secondary)'],
        ['current', css(cur).color, css(cur).backgroundColor], ['ellipsis', css(ell).color, 'var(--surface)']]) {
        const r = contrast(fg, bg); n++;
        if (r < 4.5) low.push(`${th} ${name} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
    expect(n).toBe(24);
  });

  test('pressed: a page held down fills with pressed, one step past hover', async () => {
    await render(<Pagination id="pprs" count={10} defaultPage={7} />);
    const pg = named('pprs', 'Page 1');
    await press(pg, () => expect.poll(() => css(pg).backgroundColor).toBe(color('var(--pressed)')));
  });

  test('an arrow that reaches the first or last page hands focus to the other arrow, buttons and links alike (FJ1)', async () => {
    await render(<>
      <Pagination id="pfb" count={3} defaultPage={2} />
      <Pagination id="pfl" count={3} defaultPage={2} getHref={(n) => '#p' + n} />
    </>, { wrapper: EnUS });
    for (const id of ['pfb', 'pfl']) {
      const prev = named(id, 'Previous page'), next = named(id, 'Next page');
      next.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => [shown(id), document.activeElement === prev]).toEqual(['< 1 2 [3] (>)', true]);
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => [shown(id), document.activeElement === next]).toEqual(['(<) [1] 2 3 >', true]);
    }
  });


  // O7: with total and pageSize, which items the page shows, in the locale's digits and grouping.
  test('total and pageSize: a muted "21–30 of 245" before the pages, the last page cut to the total, one item alone, none at all; Indonesian under id-ID (O7)', async () => {
    const summary = (id: string) => el(id).querySelector('p')?.textContent;
    await render(<EnUS>
      <Pagination id="s1" count={25} page={3} total={245} pageSize={10} />
      <Pagination id="s2" count={25} page={25} total={245} pageSize={10} />
      <Pagination id="s3" count={2} page={2} total={11} pageSize={10} />
      <Pagination id="s4" count={0} total={0} pageSize={10} />
      <Pagination id="s5" count={1235} page={101} total={12345} pageSize={10} />
      <Pagination id="s6" count={25} page={3} total={245} />
    </EnUS>);
    expect(['s1', 's2', 's3', 's4', 's5', 's6'].map(summary)).toEqual(['21–30 of 245', '241–245 of 245', '11 of 11', '0 of 0', '1,001–1,010 of 12,345', undefined]);
    // Before the list, inside the nav, muted at 4.5:1.
    expect([el('s1').firstElementChild!.tagName, css(el('s1').firstElementChild).color === css(el('s1')).color]).toEqual(['P', false]);
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><Pagination id="s7" count={1235} page={101} total={12345} pageSize={10} /></SerupaProvider>);
    expect(summary('s7')).toBe('1.001–1.010 dari 12.345');
  });

  test('total and pageSize: the pages sit at the end of the row, and wrap under the summary before showing fewer (O7)', async () => {
    await render(<EnUS>
      <div style={{ width: '560px' }}><Pagination id="w1" count={25} page={3} total={245} pageSize={10} /></div>
      <div style={{ width: '300px' }}><Pagination id="w2" count={25} page={12} total={245} pageSize={10} /></div>
    </EnUS>);
    const [p1, l1] = [el('w1').querySelector('p')!, el('w1').querySelector('ul')!], last1 = l1.lastElementChild!.getBoundingClientRect();
    expect([Math.round(p1.getBoundingClientRect().top) === Math.round(l1.getBoundingClientRect().top) || p1.getBoundingClientRect().bottom > l1.getBoundingClientRect().top, Math.round(last1.right), shown('w1')])
      .toEqual([true, Math.round(el('w1').getBoundingClientRect().right), '< 1 2 [3] 4 5 … 25 >']);
    const [p2, l2] = [el('w2').querySelector('p')!, el('w2').querySelector('ul')!];
    // At 300px the summary and the full row don't fit on one line: the pages go under it, and fit.
    await expect.poll(() => l2.getBoundingClientRect().top >= p2.getBoundingClientRect().bottom).toBe(true);
    expect([l2.scrollWidth <= l2.clientWidth + 1, el('w2').scrollWidth <= 300]).toEqual([true, true]);
  });

  // GR56: with justify-content: flex-end the pages that didn't fit spilled past the start edge, unmeasured and never
  // cut: at 288px Previous sat at x -99, page 1 and the ellipsis off screen, and Tab focused Previous there.
  test('total and pageSize, too narrow for every page (288px, LTR and RTL): the pages are cut to fit, none past either edge (GR56)', async () => {
    await render(<EnUS>
      <div style={{ width: '288px' }}><Pagination id="n1" count={1235} defaultPage={1000} total={12345} pageSize={10} /></div>
      <div dir="rtl" style={{ width: '288px' }}><Pagination id="n2" count={1235} defaultPage={1000} total={12345} pageSize={10} /></div>
    </EnUS>);
    for (const id of ['n1', 'n2']) {
      await expect.poll(() => { const l = el(id).querySelector('ul')!; return l.scrollWidth <= l.clientWidth + 1; }).toBe(true);
      const box = el(id).getBoundingClientRect(), items = [...el(id).querySelectorAll('li')].map((li) => li.getBoundingClientRect());
      expect([items.every((r) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5), shown(id).startsWith('<'), shown(id).endsWith('>')]).toEqual([true, true, true]);
    }
  });
});
