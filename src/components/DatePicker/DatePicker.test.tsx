import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast } from '../../../tools/test/vitest/helpers';
import { Calendar } from '../Calendar/Calendar';
import { DatePicker } from './DatePicker';

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const announcerA = () => document.querySelector<HTMLElement>('[data-dk-announcer-assertive]');
const popup = (id: string) => document.querySelector(`#${id} ~ .dk-date-picker__popup`) as HTMLElement;
const button = (id: string) => document.querySelector(`#${id} ~ .dk-date-picker__button`) as HTMLButtonElement;
const focused = () => { const a = document.activeElement as HTMLElement; return a.dataset.date || a.id || a.tagName; };
const type = async (id: string, text: string, key = '{Tab}') => { await userEvent.fill(el(id), text); await userEvent.keyboard(key); };

function Ctl(props: { calls: string[]; setRef?: { set?: (d: Date | null) => void } }) {
  const [v, setV] = React.useState<Date | null>(new Date(2025, 0, 15));
  if (props.setRef) props.setRef.set = setV;
  return <DatePicker id="ctl" aria-label="Due" value={v} onValueChange={(d) => { props.calls.push(d ? d.toDateString() : 'null'); setV(d); }} name="due" locale="en-US" min={new Date(2025, 0, 1)} max={new Date(2025, 11, 31)} />;
}

describe('DatePicker', () => {
  test('typed text it puts back is reported: onInvalidInput with "unreadable" or "unavailable", and screen readers hear it wasn\'t accepted', async () => {
    const calls: string[] = [];
    await render(<DatePicker id="dpi" locale="en-US" defaultValue={new Date(2026, 4, 10)} min={new Date(2026, 0, 1)} max={new Date(2026, 11, 31)} onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    await type('dpi', 'soon');
    await type('dpi', '03/04/2030');
    expect([el('dpi').value, calls]).toEqual(['05/10/2026', ['soon:unreadable', '03/04/2030:unavailable']]);
    await expect.poll(() => announcerA()?.textContent).toContain('"03/04/2030" wasn\'t accepted, so the previous value was kept.');
  });

  test('in a 500px tall window with the field at mid-height, the calendar stays on screen and scrolls inside, so its last week can be reached', async () => {
    await page.viewport(900, 500);
    try {
      await render(<div style={{ position: 'fixed', top: '230px', left: '20px' }}><DatePicker id="mid" aria-label="Date" defaultValue={new Date(2026, 2, 1)} /></div>);
      await userEvent.click(button('mid'));
      const p = popup('mid'), r = p.getBoundingClientRect();
      expect([r.top >= 8, r.bottom <= 500 - 8, p.scrollHeight > p.clientHeight, getComputedStyle(p).overflowY]).toEqual([true, true, true, 'auto']);
      const last = [...p.querySelectorAll<HTMLElement>('[data-date]')].pop()!;
      last.scrollIntoView({ block: 'nearest' });
      const lr = last.getBoundingClientRect();
      expect(lr.bottom <= r.bottom + 1 && lr.top >= r.top - 1).toBe(true);
    } finally { await page.viewport(900, 700); }
  });

  test('a dk-input field with a "Choose a date" button (aria-haspopup="dialog"); the placeholder shows the locale\'s pattern; ref goes to the field', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<>
      <DatePicker id="dp" aria-label="Start" locale="en-US" ref={ref} />
      <DatePicker id="dpde" aria-label="Beginn" locale="de-DE" defaultValue={new Date(2025, 10, 22)} />
    </>);
    const i = el('dp'), b = button('dp');
    expect(ref.current).toBe(i);
    expect([i.placeholder, i.inputMode, b.getAttribute('aria-label'), b.getAttribute('aria-haspopup'), b.getAttribute('aria-expanded')]).toEqual(['mm/dd/yyyy', 'numeric', 'Choose a date', 'dialog', 'false']);
    expect(i.parentElement!.className).toMatch(/dk-input/);
    expect(el('dpde').value + ' ' + el('dpde').placeholder).toBe('22.11.2025 dd.mm.yyyy');
  });

  test('typing: the locale\'s order is read on blur and written in full; yyyy-mm-dd works and Enter reads it; text that isn\'t a date puts back the last good one; clearing clears the value', async () => {
    await render(<DatePicker id="dp" aria-label="Start" locale="en-US" />);
    await type('dp', '3/7/25');
    expect(el('dp').value).toBe('03/07/2025');
    await type('dp', '2024-12-31', '{Enter}');
    expect(el('dp').value).toBe('12/31/2024');
    await type('dp', '13/45/2024');
    expect(el('dp').value).toBe('12/31/2024');
    await type('dp', '');
    expect(el('dp').value).toBe('');
  });

  test('non-Gregorian and non-Latin locales (th, ja-u-ca-japanese, fa, ar-EG): the field shows Gregorian years in Latin digits, and a blur keeps the same day; typed local digits are read', async () => {
    const d = new Date(2025, 10, 22), seen: string[] = [];
    await render(<>{['th', 'ja-u-ca-japanese', 'fa', 'ar-EG'].map((l, i) => <DatePicker key={l} id={`l${i}`} aria-label={l} locale={l} defaultValue={d} onValueChange={(v) => seen.push(l + ' ' + (v ? v.toDateString() : 'null'))} />)}</>);
    for (const i of [0, 1, 2, 3]) {
      expect(el(`l${i}`).value).toContain('2025');
      const before = el(`l${i}`).value;
      await userEvent.click(el(`l${i}`));
      await userEvent.keyboard('{Tab}');
      expect(el(`l${i}`).value).toBe(before);
    }
    expect(seen).toEqual([]);
    await type('l3', '٠٣/٠١/٢٠٢٦');
    expect(seen).toEqual(['ar-EG ' + new Date(2026, 0, 3).toDateString()]);
  });

  test('the button opens a dialog in the top layer with focus on the chosen day; picking a day fills the field, closes the popup and returns focus to the field', async () => {
    await render(<DatePicker id="dp" aria-label="Start" locale="en-US" defaultValue={new Date(2024, 11, 31)} />);
    await userEvent.click(button('dp'));
    const d = popup('dp');
    expect([!d.hidden, d.getAttribute('role'), d.getAttribute('aria-label'), focused(), button('dp').getAttribute('aria-expanded'), d.matches(':popover-open')]).toEqual([true, 'dialog', 'Choose a date', '2024-12-31', 'true', true]);
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect([el('dp').value, !popup('dp').hidden, focused()]).toEqual(['01/01/2025', false, 'dp']);
  });

  test('Alt+ArrowDown opens it from the field; Escape closes it and returns focus; a click outside closes it', async () => {
    await render(<DatePicker id="dp" aria-label="Start" locale="en-US" defaultValue={new Date(2025, 0, 1)} />);
    el('dp').focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(focused()).toBe('2025-01-01');
    await userEvent.keyboard('{Escape}');
    expect([focused(), popup('dp').hidden]).toEqual(['dp', true]);
    await userEvent.click(button('dp'));
    expect(popup('dp').hidden).toBe(false);
    await userEvent.click(document.body, { position: { x: 340, y: 5 } });
    expect(popup('dp').hidden).toBe(true);
  });

  test('Tab past the calendar closes it, leaving focus on the next control; Shift+Tab back to the button keeps it open', async () => {
    await render(<><DatePicker id="dp" aria-label="Start" locale="en-US" defaultValue={new Date(2025, 0, 1)} /><button id="after">After</button></>);
    await userEvent.click(button('dp'));
    expect(popup('dp').hidden).toBe(false);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(popup('dp').hidden).toBe(false);
    for (let i = 0; i < 12 && document.activeElement !== el('after') && document.activeElement !== document.getElementById('after'); i++) await userEvent.keyboard('{Tab}');
    expect([focused(), popup('dp').hidden]).toEqual(['after', true]);
  });

  test('touch: a finger that starts a scroll outside (pointercancel, no click) leaves the calendar open; a tap outside closes it', async () => {
    await render(<DatePicker id="dp" aria-label="Start" locale="en-US" defaultValue={new Date(2025, 0, 1)} />);
    await userEvent.click(button('dp'));
    const touch = (type: string) => document.body.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch' }));
    touch('pointerdown'); touch('pointercancel');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(r));
    expect(popup('dp').hidden).toBe(false);
    touch('pointerdown'); touch('pointerup');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect.poll(() => popup('dp').hidden).toBe(true);
  });

  test('name: a hidden input sends yyyy-mm-dd; controlled, with max: a day after max puts back the value; a good day calls onValueChange and the hidden input follows; a new value from outside rewrites the field', async () => {
    const calls: string[] = [], setRef: { set?: (d: Date | null) => void } = {};
    await render(<Ctl calls={calls} setRef={setRef} />);
    const hid = () => document.querySelector<HTMLInputElement>('input[type=hidden][name=due]')!.value;
    expect(hid()).toBe('2025-01-15');
    await type('ctl', '6/1/2026');
    expect([el('ctl').value, calls.length]).toEqual(['01/15/2025', 0]);
    await type('ctl', '2/14/2025');
    expect([calls.join(), hid()]).toEqual(['Fri Feb 14 2025', '2025-02-14']);
    React.act(() => setRef.set!(new Date(2025, 6, 4)));
    await expect.poll(() => el('ctl').value).toBe('07/04/2025');
  });

  test('disabled: the field and button are disabled and faded', async () => {
    await render(<DatePicker id="dis" aria-label="Off" disabled />);
    expect([el('dis').disabled, el('dis').parentElement!.querySelector('button')!.disabled]).toEqual([true, true]);
    await expect.poll(() => getComputedStyle(el('dis').parentElement!).opacity).toBe('0.5');
  });

  test('contrast: day, weekday, outside, today, hover and selected text 4.5:1, the selected fill and calendar icon 3:1, in all six themes', async () => {
    await render(<><Ctl calls={[]} /><Calendar data-testid="today" /></>);
    await userEvent.click(button('ctl'));
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const pop = popup('ctl'), bg = getComputedStyle(pop).backgroundColor, cs = (sel: string) => getComputedStyle(pop.querySelector(sel)!);
      const day = pop.querySelector<HTMLElement>('.dk-calendar__day:not(.dk-calendar__day--outside):not(.dk-calendar__day--selected):not(.dk-calendar__day--today)')!;
      const sel = cs('.dk-calendar__day--selected');
      const pairs: Array<[string, string, string, number]> = [['title', cs('.dk-calendar__title').color, bg, 4.5], ['weekday', cs('th').color, bg, 4.5], ['day', getComputedStyle(day).color, bg, 4.5], ['outside day', cs('.dk-calendar__day--outside').color, bg, 4.5], ['selected day', sel.color, sel.backgroundColor, 4.5], ['selected day vs popup', sel.backgroundColor, bg, 3]];
      day.style.background = 'var(--calendar-day-bg-hover, var(--surface-muted))';
      pairs.push(['day on hover', getComputedStyle(day).color, getComputedStyle(day).backgroundColor, 4.5]);
      day.style.background = '';
      const tb = document.querySelector('[data-testid=today] .dk-calendar__day--today:not(.dk-calendar__day--selected)');
      if (tb) pairs.push(['today', getComputedStyle(tb).color, getComputedStyle(document.body).backgroundColor, 4.5]);
      const btn = button('ctl');
      pairs.push(['calendar button', getComputedStyle(btn).color, getComputedStyle(btn.parentElement!).backgroundColor, 3]);
      for (const [k, fg, on, min] of pairs) { const r = contrast(fg, on); n++; if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    still.remove();
    expect(low).toEqual([]);
    expect(n).toBe(54);
  });
});
