import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast, css, press, iconPoints } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
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

});
