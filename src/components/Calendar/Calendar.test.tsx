import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { color, css, forcedColors, press } from '../../../tools/test/vitest/helpers';
import { Calendar, type CalendarProps } from './Calendar';

const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const cal = <T extends HTMLElement = HTMLElement>(sel: string) => q<T>(`[data-testid=cal] ${sel}`);
const focused = () => { const a = document.activeElement as HTMLElement; return a.dataset.date || a.id || a.tagName; };
const title = () => cal('.dk-calendar__title').textContent;

// The script's main calendar: March 2025, Sunday weeks, min Feb 3, max Jun 20, March Sundays refused.
function Cal(props: { picks?: string[]; months?: string[]; cref?: React.Ref<HTMLDivElement> } & Partial<CalendarProps>) {
  const { picks = [], months = [], cref, ...rest } = props;
  return <Calendar data-testid="cal" locale="en-US" weekStartsOn={0} defaultMonth={new Date(2025, 2, 10)} defaultValue={new Date(2025, 2, 10)} className="extra" ref={cref}
    min={new Date(2025, 1, 3)} max={new Date(2025, 5, 20)} isDateDisabled={(d) => d.getDay() === 0 && d.getMonth() === 2}
    onValueChange={(d) => { picks.push(d.toDateString()); }} onMonthChange={(m) => { months.push(m.toDateString()); }} {...rest} />;
}

describe('Calendar', () => {
  test('plain "yyyy-mm-dd" strings: value, min and max take them as those local days, and onValueChange also gets the day as "yyyy-mm-dd"', async () => {
    const picks: string[] = [];
    await render(<div data-testid="cal"><Calendar value="2026-10-14" min="2026-10-10" max="2026-10-20" onValueChange={(d, iso) => picks.push(d.getHours() + ':' + d.getDate() + ' ' + iso)} /></div>);
    expect([cal<HTMLElement>('[aria-selected="true"] [data-date]').dataset.date, cal('[data-date="2026-10-09"]').getAttribute('aria-disabled'), cal('[data-date="2026-10-21"]').getAttribute('aria-disabled')]).toEqual(['2026-10-14', 'true', 'true']);
    cal<HTMLElement>('[data-date="2026-10-16"]').click();
    expect(picks).toEqual(['0:16 2026-10-16']);
  });

  test('a grid named by the "March 2025" title (aria-live), six weeks of 7 days from Sun Feb 23, weekday headers with full names, one Tab stop on the selected day; ref and className', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Cal cref={ref} />);
    const el = q('[data-testid=cal]'), grid = el.querySelector('[role=grid]')!, t = el.querySelector('.dk-calendar__title')!;
    expect(ref.current).toBe(el);
    expect(el.className).toMatch(/extra/);
    expect([t.textContent, t.getAttribute('aria-live'), document.getElementById(grid.getAttribute('aria-labelledby')!)!.textContent]).toEqual(['March 2025', 'polite', 'March 2025']);
    expect([grid.querySelectorAll('tbody tr').length, grid.querySelectorAll('tbody button').length]).toEqual([6, 42]);
    // Short names are shown, full ones are what screen readers read (the short span is hidden from them).
    expect([...grid.querySelectorAll('th [aria-hidden]')].map((x) => x.textContent).join()).toBe('Sun,Mon,Tue,Wed,Thu,Fri,Sat');
    expect([...grid.querySelectorAll('th .dk-visually-hidden')].map((x) => x.textContent).join()).toBe('Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday');
    expect([grid.querySelector('th')!.getAttribute('abbr'), css(grid.querySelector('th .dk-visually-hidden')).position]).toEqual(['Sunday', 'absolute']);
    expect(grid.querySelector<HTMLElement>('tbody button')!.dataset.date).toBe('2025-02-23');
    expect([...grid.querySelectorAll<HTMLElement>('button[tabindex="0"]')].map((x) => x.dataset.date).join()).toBe('2025-03-10');
    expect(grid.querySelector('[data-date="2025-02-23"]')!.className).toMatch(/outside/);
  });

  test('each day is named by its full date and the chosen one is aria-selected', async () => {
    await render(<Cal />);
    const d = cal('[data-date="2025-03-10"]');
    expect([d.getAttribute('aria-label'), d.parentElement!.getAttribute('aria-selected')]).toEqual(['Monday, March 10, 2025', 'true']);
  });

  test('forced colors: the selected day is Highlight with HighlightText, kept as is (no backplate hides the number)', async () => {
    await render(<Cal />);
    const d = cal('[data-date="2025-03-10"]'), other = cal('[data-date="2025-03-11"]');
    const r = await forcedColors((active) => active && [css(d).forcedColorAdjust, css(other).forcedColorAdjust, css(d).color !== css(d).backgroundColor]);
    if (r) expect(r).toEqual(['none', 'auto', true]);
  });

  test('de-DE: German names and weeks starting on Monday', async () => {
    await render(<Calendar data-testid="de" locale="de-DE" defaultMonth={new Date(2025, 2, 1)} />);
    const de = [...document.querySelectorAll('[data-testid=de] th [aria-hidden]')].map((x) => x.textContent).join() + ' ' + q('[data-testid=de] .dk-calendar__title').textContent;
    expect(de).toMatch(/^Mo\.?,Di\.?,Mi\.?,Do\.?,Fr\.?,Sa\.?,So\.? März 2025$/);
  });

  test('th, fa, ja-u-ca-japanese, ar-EG: the title and day labels name the Gregorian month shown in the grid, with localized month names', async () => {
    await render(<>{['th', 'fa', 'ja-u-ca-japanese', 'ar-EG'].map((l) => <Calendar key={l} data-testid={l} locale={l} defaultMonth={new Date(2025, 10, 1)} />)}</>);
    for (const l of ['th', 'fa', 'ja-u-ca-japanese', 'ar-EG']) {
      const t = q(`[data-testid="${l}"] .dk-calendar__title`).textContent;
      const label = q(`[data-testid="${l}"] [data-date="2025-11-22"]`).getAttribute('aria-label')!;
      expect(t, l).toContain('2025');
      expect(t, l).toContain(new Intl.DateTimeFormat(l, { calendar: 'gregory', month: 'long' }).format(new Date(2025, 10, 1)));
      expect(label, l).toMatch(/22.*2025|2025.*22/);
    }
  });

  test('without Intl.Locale week info: weeks start by region (US Sunday, DE Monday, EG Saturday, MV Friday, BR Sunday)', async () => {
    // Firefox has no week info; take it away here so the region fallback runs in every engine.
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const saved = ['getWeekInfo', 'weekInfo'].map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)] as const);
    for (const [k] of saved) delete proto[k];
    try {
      await render(<div>{['en-US', 'de-DE', 'de', 'ar-EG', 'dv-MV', 'pt-BR'].map((l) => <Calendar key={l} data-l={l} locale={l} defaultMonth={new Date(2025, 2, 1)} />)}</div>);
      const starts = [...document.querySelectorAll<HTMLElement>('[data-l]')].map((c) => c.dataset.l + ':' + c.querySelector<HTMLElement>('[role=grid] [data-date]')!.dataset.date).join();
      expect(starts).toBe('en-US:2025-02-23,de-DE:2025-02-24,de:2025-02-24,ar-EG:2025-03-01,dv-MV:2025-02-28,pt-BR:2025-02-23');
    } finally {
      for (const [k, d] of saved) if (d) Object.defineProperty(proto, k, d);
    }
  });

  test('today is aria-current="date" and the Tab stop when nothing is chosen', async () => {
    await render(<Calendar data-testid="today" />);
    const b = q('[data-testid=today] [aria-current=date]');
    expect([b.textContent, b.getAttribute('tabindex'), /today/.test(b.className)]).toEqual([String(new Date().getDate()), '0', true]);
  });

  test('arrows move a day or week, Home/End to the week\'s ends, PageUp/PageDown a month, Shift+PageUp a year, stopping at min and max; moving past the month shows the next one and keeps focus on the day; onMonthChange gets the first of each month shown', async () => {
    const months: string[] = [];
    await render(<Cal months={months} />);
    cal('[data-date="2025-03-10"]').focus();
    const seen: string[] = [];
    for (const k of ['{ArrowRight}', '{ArrowDown}', '{ArrowLeft}', '{ArrowUp}', '{End}', '{Home}', '{PageDown}', '{PageUp}', '{Shift>}{PageUp}{/Shift}']) { await userEvent.keyboard(k); seen.push(focused()); }
    // A year back from Mar 9 2025 is before min (Feb 3 2025): it stops there, and ArrowUp stays.
    expect(seen).toEqual(['2025-03-11', '2025-03-18', '2025-03-17', '2025-03-10', '2025-03-15', '2025-03-09', '2025-04-09', '2025-03-09', '2025-02-03']);
    await userEvent.keyboard('{ArrowUp}');
    expect([focused(), title()]).toEqual(['2025-02-03', 'February 2025']);
    // A year on is after max (Jun 20 2025): it stops there too.
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect([focused(), title()]).toEqual(['2025-06-20', 'June 2025']);
    await userEvent.keyboard('{ArrowDown}{End}');
    expect(focused()).toBe('2025-06-20');
    await userEvent.keyboard('{PageUp}{PageUp}');
    expect([focused(), months.slice(-2).join('|')]).toEqual(['2025-04-20', 'Thu May 01 2025|Tue Apr 01 2025']);
  });

  test('Enter and a click pick a day: onValueChange, aria-selected moves', async () => {
    const picks: string[] = [];
    await render(<Cal picks={picks} defaultMonth={new Date(2025, 3, 1)} />);
    cal('[data-date="2025-04-08"]').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(cal('[data-date="2025-04-17"]'));
    expect(picks.join('|')).toBe('Tue Apr 08 2025|Thu Apr 17 2025');
    expect([...document.querySelectorAll<HTMLElement>('[data-testid=cal] [aria-selected=true] button')].map((b) => b.dataset.date).join()).toBe('2025-04-17');
  });

  test('min: days before it are aria-disabled and the previous button stops at its month; isDateDisabled: refused days are aria-disabled, faded and can\'t be picked; max: the next button stops at its month', async () => {
    const picks: string[] = [];
    await render(<Cal picks={picks} defaultMonth={new Date(2025, 3, 1)} />);
    await userEvent.click(cal('button[aria-label="Previous month"]'));
    await userEvent.click(cal('button[aria-label="Previous month"]'));
    expect([title(), cal<HTMLButtonElement>('.dk-calendar__nav--prev').disabled]).toEqual(['February 2025', true]);
    expect([cal('[data-date="2025-02-02"]').getAttribute('aria-disabled'), cal('[data-date="2025-02-03"]').getAttribute('aria-disabled')]).toEqual(['true', null]);
    await userEvent.click(cal('button[aria-label="Next month"]'));
    await userEvent.click(cal('[data-date="2025-03-16"]'), { force: true });
    expect([cal('[data-date="2025-03-16"]').getAttribute('aria-disabled'), picks.length]).toEqual(['true', 0]);
    await expect.poll(() => getComputedStyle(cal('[data-date="2025-03-16"]')).opacity).toBe('0.5');
    for (let i = 0; i < 3; i++) await userEvent.click(cal('button[aria-label="Next month"]'));
    expect([title(), cal<HTMLButtonElement>('.dk-calendar__nav--next').disabled]).toEqual(['June 2025', true]);
  });

  test('--calendar-selected-bg overrides one calendar', async () => {
    await render(<Calendar data-testid="tok" style={{ '--calendar-selected-bg': 'rgb(1, 2, 3)' } as React.CSSProperties} defaultValue={new Date(2025, 2, 10)} weekStartsOn={0} />);
    await expect.poll(() => getComputedStyle(q('[data-testid=tok] .dk-calendar__day--selected')).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('pressed: a day held down fills with pressed, one step past hover', async () => {
    await render(<Cal />);
    const d = cal('[data-date="2025-03-12"]');
    await press(d, () => expect.poll(() => css(d).backgroundColor).toBe(color('var(--pressed)')));
  });

});
