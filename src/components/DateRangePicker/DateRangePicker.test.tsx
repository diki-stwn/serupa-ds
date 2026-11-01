import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { DateRangePicker, type DateRange } from './DateRangePicker';

const box = (tid: string) => document.querySelector(`[data-testid=${tid}]`) as HTMLElement;
const fields = (tid: string) => [...box(tid).querySelectorAll<HTMLInputElement>('input[type=text]')];
const vals = (tid: string) => fields(tid).map((x) => x.value).join(' – ');
const pop = (tid: string) => box(tid).querySelector('[role=dialog]') as HTMLElement;
const isOpen = (tid: string) => !pop(tid).hidden;
const day = (tid: string, d: string) => pop(tid).querySelector(`[data-date="${d}"]`) as HTMLElement;
const inRange = (tid: string) => [...pop(tid).querySelectorAll<HTMLElement>('.dk-calendar__day--in-range')].map((b) => b.dataset.date!.slice(5)).join();
const focused = () => { const a = document.activeElement as HTMLElement; return a.dataset.date || a.getAttribute('aria-label') || a.tagName; };
const btn = (tid: string) => box(tid).querySelector('button') as HTMLButtonElement;
const fill = async (tid: string, i: number, text: string, key = '{Tab}') => { await userEvent.fill(fields(tid)[i], text); await userEvent.keyboard(key); };
const str = (r: DateRange) => (r.start ? r.start.toDateString() : '-') + '..' + (r.end ? r.end.toDateString() : '-');

function Trip(props: { value?: DateRange; tref?: React.Ref<HTMLSpanElement> }) {
  return <div style={{ width: '700px' }}><Field label="Trip" hint="mm/dd/yyyy">
    <DateRangePicker data-testid="trip" locale="en-US" weekStartsOn={0} className="extra" ref={props.tref} defaultValue={props.value || { start: new Date(2025, 2, 10), end: new Date(2025, 2, 14) }} />
  </Field></div>;
}
function Ctl(props: { changes: string[]; setRef: { set?: (r: DateRange) => void } }) {
  const [v, setV] = React.useState<DateRange>({ start: new Date(2025, 5, 2), end: new Date(2025, 5, 6) });
  props.setRef.set = setV;
  return <DateRangePicker data-testid="ctl" aria-label="Stay" value={v} onValueChange={(r) => { props.changes.push(str(r)); setV(r); }} startName="from" endName="to" locale="en-US" weekStartsOn={0} min={new Date(2025, 5, 1)} max={new Date(2025, 7, 31)} />;
}

describe('DateRangePicker', () => {
  test('switching to another window or tab mid-typing keeps the typed text and says nothing (L8E27)', async () => {
    const calls: string[] = [];
    await render(<DateRangePicker data-testid="drpw" locale="en-US" onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    const f = fields('drpw')[0];
    await userEvent.click(f);
    await userEvent.keyboard('5/1');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    f.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); f.dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([f.value, calls]).toEqual(['5/1', []]);
  });

  test('both fields are described by the Field hint and the format to type', async () => {
    await render(<Trip />);
    expect(fields('trip').map((f) => (f.getAttribute('aria-describedby') || '').split(' ').map((i) => document.getElementById(i)!.textContent).join(' | '))).toEqual(['mm/dd/yyyy | Format: mm/dd/yyyy', 'mm/dd/yyyy | Format: mm/dd/yyyy']);
  });

  test('text typed in either field and put back is reported through onInvalidInput', async () => {
    const calls: string[] = [];
    await render(<DateRangePicker data-testid="drpi" locale="en-US" min={new Date(2026, 0, 1)} onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    await userEvent.fill(fields('drpi')[0], '12/31/2025');
    await userEvent.keyboard('{Tab}');
    await userEvent.fill(fields('drpi')[1], 'later');
    await userEvent.keyboard('{Enter}');
    expect([vals('drpi'), calls]).toEqual([' – ', ['12/31/2025:unavailable', 'later:unreadable']]);
  });

  test('an end typed before the start is put back and reported as unavailable, not dropped without a word', async () => {
    const calls: string[] = [];
    await render(<DateRangePicker data-testid="drpo" locale="en-US" onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    await userEvent.fill(fields('drpo')[0], '10/20/2026');
    await userEvent.keyboard('{Tab}');
    await userEvent.fill(fields('drpo')[1], '10/10/2026');
    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual(['10/10/2026:unavailable']);
  });

  test('plain "yyyy-mm-dd" strings: value and max take them as those local days, and onValueChange also gets the range as "yyyy-mm-dd"', async () => {
    const calls: string[] = [];
    function Plain() {
      const [v, setV] = React.useState<{ start: string | null; end: string | null }>({ start: '2026-10-05', end: '2026-10-09' });
      return <DateRangePicker data-testid="drps" locale="en-US" value={v} max="2026-10-31" onValueChange={(r, iso) => { calls.push(str(r) + ' ' + iso.start + '..' + iso.end); setV(iso); }} />;
    }
    await render(<Plain />);
    expect(vals('drps')).toBe('10/05/2026 – 10/09/2026');
    await fill('drps', 1, '11/02/2026');   // after max: put back
    await fill('drps', 1, '10/12/2026');
    expect([calls, vals('drps')]).toEqual([['Mon Oct 05 2026..Mon Oct 12 2026 2026-10-05..2026-10-12'], '10/05/2026 – 10/12/2026']);
  });

  test('a role="group" dk-input box with "Start date" and "End date" fields, a "Choose dates" button; Field labels the start field and describes both; ref and className; defaultValue fills both fields', async () => {
    const ref = React.createRef<HTMLSpanElement>();
    await render(<Trip tref={ref} />);
    const el = box('trip'), [s, e] = fields('trip');
    expect(ref.current).toBe(el);
    expect(el.className).toMatch(/dk-input.*extra/);
    expect([el.getAttribute('role'), s.getAttribute('aria-label'), e.getAttribute('aria-label'), s.placeholder, btn('trip').getAttribute('aria-label')]).toEqual(['group', 'Start date', 'End date', 'mm/dd/yyyy', 'Choose dates']);
    expect(!!s.id && document.querySelector('label')!.htmlFor === s.id).toBe(true);
    expect(!!s.getAttribute('aria-describedby') && s.getAttribute('aria-describedby') === e.getAttribute('aria-describedby')).toBe(true);
    expect(vals('trip')).toBe('03/10/2025 – 03/14/2025');
  });

  test('th and fa: both fields show Gregorian years in Latin digits and a blur keeps the range', async () => {
    const changes: string[] = [];
    await render(<>{['th', 'fa'].map((l) => <DateRangePicker key={l} data-testid={l} aria-label={l} locale={l} defaultValue={{ start: new Date(2025, 10, 22), end: new Date(2025, 11, 3) }} onValueChange={(r) => changes.push(str(r))} />)}</>);
    for (const l of ['th', 'fa']) {
      const before = vals(l);
      expect(before).toMatch(/2025.*2025/);
      for (const f of fields(l)) { await userEvent.click(f); await userEvent.keyboard('{Tab}'); }
      expect(vals(l)).toBe(before);
    }
    expect(changes).toEqual([]);
  });

  test('the button opens a dialog in the top layer with March and April 2025, other months\' days blank, only the outer month buttons, focus on the start; both ends are selected and the days between filled', async () => {
    await render(<Trip />);
    await userEvent.click(btn('trip'));
    const d = pop('trip'), vis = (sel: string) => [...d.querySelectorAll(sel)].map((x) => getComputedStyle(x).visibility).join();
    expect([d.getAttribute('role'), d.matches(':popover-open')]).toEqual(['dialog', true]);
    expect([...d.querySelectorAll('[role=grid]')].map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent).join()).toBe('March 2025,April 2025');
    expect([d.querySelectorAll('td[role=gridcell]:empty').length > 0, !!d.querySelector('.dk-calendar__day--outside')]).toEqual([true, false]);
    expect([vis('[data-component=calendar] > div:first-child > button:first-child'), vis('[data-component=calendar] > div:first-child > button:last-child')]).toEqual(['visible,hidden', 'hidden,visible']);
    expect([focused(), d.querySelector(':scope p[aria-live]')!.textContent]).toEqual(['2025-03-10', 'Choose the start date']);
    expect([...d.querySelectorAll<HTMLElement>('[aria-selected=true] button')].map((x) => x.dataset.date).join()).toBe('2025-03-10,2025-03-14');
    expect(inRange('trip')).toBe('03-11,03-12,03-13');
  });

  test('picking: the first pick sets the start and clears the end, asking for the end; pointing previews the range across both months; a day before the start moves it; the second pick sets the end, closes and returns focus to the start field', async () => {
    await render(<Trip />);
    await userEvent.click(btn('trip'));
    await userEvent.click(day('trip', '2025-03-20'));
    expect([vals('trip'), pop('trip').querySelector('p[aria-live]')!.textContent, isOpen('trip')]).toEqual(['03/20/2025 – ', 'Choose the end date', true]);
    await userEvent.hover(day('trip', '2025-04-02'));
    expect(inRange('trip')).toBe('03-21,03-22,03-23,03-24,03-25,03-26,03-27,03-28,03-29,03-30,03-31,04-01');
    await userEvent.click(day('trip', '2025-03-18'));
    expect([vals('trip'), isOpen('trip')]).toEqual(['03/18/2025 – ', true]);
    await userEvent.click(day('trip', '2025-04-02'));
    expect([vals('trip'), isOpen('trip'), focused()]).toEqual(['03/18/2025 – 04/02/2025', false, 'Start date']);
  });

  test('keyboard table: Space on the calendar button opens the calendar, and Space in it picks the start, then the end (FH1)', async () => {
    await render(<Trip value={{ start: new Date(2025, 2, 18), end: new Date(2025, 3, 2) }} />);
    btn('trip').focus();
    await userEvent.keyboard(' ');
    await expect.poll(() => isOpen('trip')).toBe(true);
    expect(focused()).toBe('2025-03-18');
    await userEvent.keyboard('{ArrowRight}[Space]{ArrowDown}[Space]');
    expect([vals('trip'), isOpen('trip')]).toEqual(['03/19/2025 – 03/26/2025', false]);
  });

  test('Alt+ArrowDown opens it and the keyboard picks both ends; Escape closes it and returns focus; a click outside closes it', async () => {
    await render(<Trip value={{ start: new Date(2025, 2, 18), end: new Date(2025, 3, 2) }} />);
    fields('trip')[0].focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(focused()).toBe('2025-03-18');
    await userEvent.keyboard('{ArrowRight}{Enter}{ArrowDown}{Enter}');
    expect([vals('trip'), isOpen('trip')]).toEqual(['03/19/2025 – 03/26/2025', false]);
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}{Escape}');
    expect([isOpen('trip'), focused()]).toEqual([false, 'Start date']);
    await userEvent.click(btn('trip'));
    expect(isOpen('trip')).toBe(true);
    await userEvent.click(document.body, { position: { x: 880, y: 680 } });
    expect(isOpen('trip')).toBe(false);
  });

  test('Tab past the popup closes it, leaving focus on the next control', async () => {
    await render(<><DateRangePicker id="tab" aria-label="Stay" locale="en-US" /><button id="after">After</button></>);
    const btn = document.querySelector('button[aria-haspopup=dialog]') as HTMLButtonElement;
    await userEvent.click(btn);
    const pop = document.querySelector('[role=dialog]') as HTMLElement;
    expect(pop.hidden).toBe(false);
    for (let i = 0; i < 12 && document.activeElement !== document.getElementById('after'); i++) await userEvent.keyboard('{Tab}');
    expect([(document.activeElement as HTMLElement).id, pop.hidden]).toEqual(['after', true]);
  });

  test('typing the end (yyyy-mm-dd works anywhere) is read on blur; text that isn\'t a date puts back the last good one; a start after the end clears the end', async () => {
    await render(<Trip value={{ start: new Date(2025, 2, 19), end: new Date(2025, 2, 26) }} />);
    await fill('trip', 1, '2025-04-30');
    expect(vals('trip')).toBe('03/19/2025 – 04/30/2025');
    await fill('trip', 0, '99/99/2025');
    expect(vals('trip')).toBe('03/19/2025 – 04/30/2025');
    await fill('trip', 0, '5/15/2025', '{Enter}');
    expect(vals('trip')).toBe('05/15/2025 – ');
  });

  test('startName and endName send yyyy-mm-dd; max: a typed end after it puts back the value; min: the first month\'s previous button is disabled; controlled: onValueChange gets each step, hidden inputs follow, a new value from outside rewrites the fields', async () => {
    const changes: string[] = [], setRef: { set?: (r: DateRange) => void } = {};
    await render(<Ctl changes={changes} setRef={setRef} />);
    const hid = () => ['from', 'to'].map((n) => document.querySelector<HTMLInputElement>(`input[type=hidden][name=${n}]`)!.value).join(' ');
    expect(hid()).toBe('2025-06-02 2025-06-06');
    await fill('ctl', 1, '9/15/2025');
    expect([vals('ctl'), changes.length]).toEqual(['06/02/2025 – 06/06/2025', 0]);
    await userEvent.click(btn('ctl'));
    const d = pop('ctl');
    expect([d.querySelector<HTMLButtonElement>('button[aria-label="Previous month"]')!.disabled, d.querySelector('[data-date="2025-05-31"]'), d.querySelector('[data-date="2025-06-01"]')!.getAttribute('aria-disabled')]).toEqual([true, null, null]);
    await userEvent.click(day('ctl', '2025-06-10'));
    await userEvent.click(day('ctl', '2025-07-04'));
    expect([changes.join('|'), hid()]).toEqual(['Tue Jun 10 2025..-|Tue Jun 10 2025..Fri Jul 04 2025', '2025-06-10 2025-07-04']);
    React.act(() => setRef.set!({ start: new Date(2025, 7, 1), end: null }));
    await expect.poll(() => vals('ctl')).toBe('08/01/2025 – ');
  });

  test('months={1}: one month, with other months\' days shown', async () => {
    await render(<DateRangePicker data-testid="one" aria-label="One" months={1} locale="en-US" weekStartsOn={0} />);
    await userEvent.click(btn('one'));
    expect(pop('one').querySelectorAll('[role=grid]').length).toBe(1);
    expect(pop('one').querySelectorAll('.dk-calendar__day--outside').length).toBeGreaterThan(0);
  });

  test('ref.current.focus() and autoFocus land on the start field, as a form library focusing the first invalid field expects; disabled, nothing is focused', async () => {
    const on = React.createRef<HTMLSpanElement>(), off = React.createRef<HTMLSpanElement>();
    await render(<>
      <DateRangePicker data-testid="dfa" aria-label="Stay" autoFocus />
      <DateRangePicker data-testid="dfr" ref={on} aria-label="Stay" />
      <DateRangePicker data-testid="dfd" ref={off} aria-label="Stay" disabled />
    </>);
    await expect.poll(() => document.activeElement).toBe(fields('dfa')[0]);
    expect(box('dfa').hasAttribute('autofocus')).toBe(false);
    on.current!.focus();
    expect(document.activeElement).toBe(fields('dfr')[0]);
    off.current!.focus();
    expect(document.activeElement).toBe(fields('dfr')[0]);
    expect(on.current).toBe(box('dfr'));
  });

  test('required: both fields are required, so a form won\'t submit until each end has a date; Field\'s required does the same; the root <span> gets neither', async () => {
    await render(<>
      <form id="rq-form"><DateRangePicker data-testid="rq" required defaultValue={{ start: new Date(2025, 2, 10), end: null }} /></form>
      <Field label="Stay" required><DateRangePicker data-testid="rqf" /></Field>
    </>);
    expect(fields('rq').map((x) => [x.required, x.getAttribute('aria-required')])).toEqual([[true, 'true'], [true, 'true']]);
    expect([box('rq').hasAttribute('required'), box('rq').hasAttribute('aria-required')]).toEqual([false, false]);
    expect([(document.getElementById('rq-form') as HTMLFormElement).checkValidity(), fields('rq')[0].validity.valid, fields('rq')[1].validity.valueMissing]).toEqual([false, true, true]);
    expect(fields('rqf').map((x) => x.getAttribute('aria-required'))).toEqual(['true', 'true']);
  });

  test('disabled: both fields and the button are disabled and faded', async () => {
    await render(<DateRangePicker data-testid="dis" aria-label="Off" disabled />);
    expect([...box('dis').querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')].every((x) => x.disabled)).toBe(true);
    await expect.poll(() => getComputedStyle(box('dis')).opacity).toBe('0.5');
  });

  test('opening with only a start asks for the end: one pick completes it; contrast: days in the range, the status line and the dash keep 4.5:1 in all six themes; --calendar-range-bg overrides the fill', async () => {
    await render(<Trip value={{ start: new Date(2025, 4, 15), end: null }} />);
    await userEvent.click(btn('trip'));
    await userEvent.click(day('trip', '2025-05-20'));
    expect([vals('trip'), isOpen('trip')]).toEqual(['05/15/2025 – 05/20/2025', false]);
    await userEvent.click(btn('trip'));
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const d = pop('trip'), bg = getComputedStyle(d).backgroundColor;
      const r = getComputedStyle(d.querySelector('.dk-calendar__day--in-range')!), st = getComputedStyle(d.querySelector(':scope p[aria-live]')!), dash = getComputedStyle(box('trip').querySelector(':scope > span[aria-hidden]')!);
      const field = getComputedStyle(box('trip')).backgroundColor;
      const pairs: Array<[string, string, string, number]> = [['day in range', r.color, r.backgroundColor, 4.5], ['status', st.color, bg, 4.5], ['dash', dash.color, field, 4.5]];
      for (const [k, fg, on, min] of pairs) { const x = contrast(fg, on); n++; if (x < min) low.push(`${th} ${k} ${x.toFixed(2)}`); }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light');
    expect(low).toEqual([]);
    expect(n).toBe(18);
    box('trip').style.setProperty('--calendar-range-bg', 'rgb(1, 2, 3)');
    expect(getComputedStyle(pop('trip').querySelector('.dk-calendar__day--in-range')!).backgroundColor).toBe('rgb(1, 2, 3)');
    still.remove();
  });

  test('L8E79: with no value, a today outside min..max opens the popup on min\'s or max\'s month, not on one where nothing can be picked', async () => {
    const t = new Date(), at = (n: number) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + n);
    const name = (d: Date) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
    const lo = at(400), hi = at(-400);
    await render(<><DateRangePicker data-testid="lo" aria-label="Lo" locale="en-US" months={1} min={lo} /><DateRangePicker data-testid="hi" aria-label="Hi" locale="en-US" months={1} max={hi} /></>);
    const title = async (tid: string) => { await userEvent.click(btn(tid)); const g = pop(tid).querySelector('[role=grid]')!, s = document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent; await userEvent.keyboard('{Escape}'); return s; };
    expect([await title('lo'), await title('hi')]).toEqual([name(lo), name(hi)]);
  });
});

describe('DateRangePicker popup on a phone (GR9)', () => {
  test('with the months stacked, the popup is one month wide and keeps 8px from both sides of the screen, in LTR and RTL', async () => {
    try {
      for (const w of [320, 390]) {
        await page.viewport(w, 900);
        for (const dir of ['ltr', 'rtl'] as const) {
          const r = await render(<div dir={dir}><DateRangePicker data-testid="gr9" locale="en-US" defaultValue={{ start: new Date(2025, 2, 10), end: new Date(2025, 3, 2) }} /></div>);
          await userEvent.click(btn('gr9'));
          await expect.poll(() => isOpen('gr9')).toBe(true);
          const p = pop('gr9').getBoundingClientRect(), cals = [...pop('gr9').querySelectorAll('[role=grid]')].map((g) => g.getBoundingClientRect());
          expect(cals[1].top).toBeGreaterThan(cals[0].bottom);   // stacked
          expect(p.left).toBeGreaterThanOrEqual(7.5);
          expect(w - p.right).toBeGreaterThanOrEqual(7.5);
          expect(p.width).toBeLessThan(cals[0].width + 48);   // one month plus its padding, not two across
          await r.unmount();
        }
      }
    } finally { await page.viewport(900, 700); }
  });
  test('a narrow box (200px): the end date wraps under the start date, each shown in full, and the fields and the calendar button stay inside it, nothing scrolls sideways (GR70, GR73)', async () => {
    await render(<div style={{ width: '200px' }}><DateRangePicker data-testid="narrow" aria-label="Stay" locale="en-US" defaultValue={{ start: new Date(2025, 11, 28), end: new Date(2026, 0, 6) }} /></div>);
    const b = box('narrow').getBoundingClientRect();
    for (const e of [...fields('narrow'), btn('narrow')]) {
      const r = e.getBoundingClientRect();
      expect([r.left >= b.left - 1, r.right <= b.right + 1], e.tagName).toEqual([true, true]);
    }
    const [s, e] = fields('narrow');
    // The year isn't cut off: each field's text fits it.
    expect([s.value, s.scrollWidth <= s.clientWidth + 1, e.value, e.scrollWidth <= e.clientWidth + 1]).toEqual(['12/28/2025', true, '01/06/2026', true]);
    expect(e.getBoundingClientRect().top).toBeGreaterThan(s.getBoundingClientRect().bottom - 1);
    // Each line is a full control height, so both fields stay 24px targets (WCAG 2.5.8).
    expect([s, e].map((f) => f.getBoundingClientRect().height >= 24)).toEqual([true, true]);
    expect(box('narrow').scrollWidth).toBeLessThanOrEqual(box('narrow').clientWidth + 1);
  });
});
