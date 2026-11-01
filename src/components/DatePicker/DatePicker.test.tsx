import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, withMotion, settled } from '../../../tools/test/vitest/helpers';
import { Calendar } from '../Calendar/Calendar';
import { Field } from '../Field/Field';
import { DatePicker } from './DatePicker';

const described = (e: Element) => (e.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).map((i) => document.getElementById(i)!.textContent).join(' | ');

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
  test('switching to another window or tab mid-typing keeps the typed text and says nothing; leaving the field then reads it (L8E26)', async () => {
    const calls: string[] = [];
    await render(<><DatePicker id="dwb" aria-label="Start" locale="en-US" onInvalidInput={(t, r) => calls.push(t + ':' + r)} /><button id="dwbn">Next</button></>);
    await userEvent.click(el('dwb'));
    await userEvent.keyboard('5/1');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    el('dwb').dispatchEvent(new FocusEvent('focusout', { bubbles: true })); el('dwb').dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([el('dwb').value, calls]).toEqual(['5/1', []]);
    el('dwb').focus();
    await userEvent.keyboard('2/2026');
    await userEvent.click(document.getElementById('dwbn')!);
    await expect.poll(() => el('dwb').value).toBe('05/12/2026');
  });

  test('the box says data-state open while the calendar is open, closed otherwise (G11, ADR 0012)', async () => {
    await render(<DatePicker id="ds" aria-label="Due" locale="en-US" />);
    const box = () => el('ds').closest<HTMLElement>('[data-component="date-picker"]')!;
    expect(box().dataset.state).toBe('closed');
    await userEvent.click(button('ds'));
    await expect.poll(() => box().dataset.state).toBe('open');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => box().dataset.state).toBe('closed');
  });

  test('a press on the box (side padding, past the calendar button) focuses the field with the caret at the end; a press in the open calendar is not taken for one on the box; a disabled box stays put (GG2)', async () => {
    await render(<div style={{ width: '320px' }}>
      <DatePicker id="bx" size="lg" defaultValue={new Date(2026, 2, 14)} aria-label="Due" />
      <DatePicker id="bx-off" size="lg" disabled aria-label="Off" />
      <button id="bx-away">away</button>
    </div>);
    const box = (id: string) => el(id).closest('[data-component=date-picker]') as HTMLElement;
    const b = box('bx').getBoundingClientRect(), y = b.height / 2, end = el('bx').value.length;
    for (const x of [2, b.width - 2]) {
      el('bx-away').focus();
      await userEvent.click(box('bx'), { position: { x, y } });
      expect([x, document.activeElement === el('bx'), el('bx').selectionStart]).toEqual([x, true, end]);
    }
    await userEvent.click(button('bx'));
    await expect.poll(() => popup('bx').contains(document.activeElement)).toBe(true);
    const p = popup('bx').getBoundingClientRect();
    await userEvent.click(popup('bx'), { position: { x: 3, y: p.height - 3 } });
    expect([document.activeElement === el('bx'), popup('bx').hidden]).toEqual([false, false]);   // the calendar's, not the box's
    el('bx-away').focus();
    await userEvent.click(box('bx-off'), { position: { x: 4, y }, force: true });
    expect(document.activeElement).not.toBe(el('bx-off'));
  });

  test('the format to type is part of the field\'s description, after a Field hint, in the locale\'s order: it stays when the placeholder is gone', async () => {
    await render(<><Field label="Due" hint="The last working day"><DatePicker id="fh" locale="en-US" /></Field><DatePicker id="fg" aria-label="Start" locale="de-DE" /></>);
    expect([described(el('fh')), described(el('fg'))]).toEqual(['The last working day | Format: mm/dd/yyyy', 'Format: dd.mm.yyyy']);
    await userEvent.fill(el('fh'), '3/4/2026');
    expect(described(el('fh'))).toBe('The last working day | Format: mm/dd/yyyy');
  });

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

  test('plain "yyyy-mm-dd" strings: value, min and max take them as that local day, and onValueChange also gets the day as "yyyy-mm-dd" (H10)', async () => {
    const calls: string[] = [];
    function Plain() {
      const [v, setV] = React.useState<string | null>('2026-10-24');
      return <DatePicker id="plain" aria-label="Due" locale="en-US" name="plain" value={v} min="2026-10-01" max="2026-10-31"
        onValueChange={(d, iso) => { calls.push((d ? d.getHours() + ':' + d.getDate() : 'null') + ' ' + iso); setV(iso); }} />;
    }
    await render(<Plain />);
    const hid = () => document.querySelector<HTMLInputElement>('input[type=hidden][name=plain]')!.value;
    expect([el('plain').value, hid()]).toEqual(['10/24/2026', '2026-10-24']);
    await type('plain', '11/2/2026');   // after max
    await type('plain', '10/5/2026');
    await type('plain', '');
    expect([calls, el('plain').value, hid()]).toEqual([['0:5 2026-10-05', 'null null'], '', '']);
    await render(<DatePicker id="bad" aria-label="Bad" locale="en-US" defaultValue="2026-02-30" />);
    expect(el('bad').value).toBe('');
  });

  test('a Date at UTC midnight west of Greenwich (new Date("2026-10-24")) warns once to pass the string instead; a string or a local Date doesn\'t', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const offset = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
    try {
      await render(<><DatePicker aria-label="A" defaultValue="2026-10-24" /><DatePicker aria-label="B" defaultValue={new Date(2026, 9, 24, 9)} /></>);
      expect(warn).not.toHaveBeenCalled();
      await render(<DatePicker aria-label="C" defaultValue={new Date(Date.UTC(2026, 9, 24))} />);
      expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('DatePicker'))).toEqual([expect.stringMatching(/UTC midnight .*pass the "yyyy-mm-dd" string/)]);
    } finally { warn.mockRestore(); offset.mockRestore(); }
  });

  test('L8E10: an ISO date and time from an API ("2026-10-24T00:00:00Z", "2026-10-24 09:30:00") reads as the day it writes, with one warning, instead of an empty field', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await render(<form><DatePicker id="dt1" aria-label="A" locale="en-US" name="a" defaultValue="2026-10-24T00:00:00Z" /><DatePicker id="dt2" aria-label="B" locale="en-US" defaultValue="2026-10-24 23:30:00+07:00" min="2026-10-01T00:00:00.000Z" /></form>);
      expect([el('dt1').value, el('dt2').value, (document.querySelector('input[name=a]') as HTMLInputElement).value]).toEqual(['10/24/2026', '10/24/2026', '2026-10-24']);
      expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('DatePicker'))).toEqual([expect.stringMatching(/is a date and time; it's read as 2026-10-24/)]);
    } finally { warn.mockRestore(); }
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

describe('DatePicker: autocomplete', () => {
  test('off by default; a passed autoComplete ("bday" for a date of birth) reaches the field, and what autofill types is read as the date', async () => {
    const got: string[] = [];
    await render(<><DatePicker id="dpac" aria-label="Start" /><DatePicker id="dpbd" aria-label="Date of birth" locale="en-US" autoComplete="bday" onValueChange={(d) => got.push(d ? d.toDateString() : 'null')} /></>);
    const a = document.getElementById('dpac') as HTMLInputElement, b = document.getElementById('dpbd') as HTMLInputElement;
    expect([a.getAttribute('autocomplete'), b.getAttribute('autocomplete')]).toEqual(['off', 'bday']);
    await userEvent.fill(b, '1990-05-12');
    b.blur();
    await expect.poll(() => got.at(-1)).toBe('Sat May 12 1990');
  });
  test('the calendar scales in from the point on its edge facing the field, level with the field\'s centre (EO1)', async () => {
    await render(<div style={{ padding: '0 40px' }}><DatePicker id="dpo" aria-label="Start" /></div>);
    await userEvent.click(button('dpo'));
    await expect.poll(() => popup('dpo') && !popup('dpo').hidden).toBe(true);
    // The anchor is the whole field (input and button), so the origin sits under its centre, held inside the calendar.
    const p = popup('dpo'), f = (el('dpo').parentElement as HTMLElement).getBoundingClientRect(), r = p.getBoundingClientRect();
    const [x, y] = getComputedStyle(p).transformOrigin.split(' ').map(parseFloat);
    const want = Math.min(Math.max(f.left + f.width / 2 - r.left, 0), r.width);
    expect([p.dataset.side, Math.round(y), Math.abs(x - want) <= 1]).toEqual(['bottom', 0, true]);
  });
});

describe('DatePicker: motion (DZ1)', () => {
  test('the calendar opens with a transition and fades and shrinks out faster, kept (inert) until the fade ends; from the keyboard there and gone at once, focus back on the field (KW1)', async () => {
    await withMotion(async () => {
      const ms = (a: Animation) => Number(a.effect!.getComputedTiming().duration);
      const runs = (e: Element) => e.getAnimations().filter((a) => a instanceof CSSTransition && /^(opacity|scale)$/.test(a.transitionProperty)).map((a) => [(a as CSSTransition).transitionProperty, ms(a)]).sort();
      await render(<DatePicker id="mo" aria-label="Due" locale="en-US" defaultValue={new Date(2026, 2, 1)} />);
      await userEvent.click(button('mo'));
      const p = popup('mo');
      expect([runs(p), p.getAnimations().some((a) => a instanceof CSSAnimation)]).toEqual([[['opacity', 150], ['scale', 150]], false]);
      await settled(p);
      await userEvent.click(button('mo'));
      expect([p.hidden, document.activeElement]).toEqual([true, button('mo')]);
      // Kept in the top layer while it fades only where overlay can be held (Chromium); elsewhere it closes at once.
      if (CSS.supports('overlay', 'auto')) {
        expect([getComputedStyle(p).display, p.inert, !!p.querySelector('[data-date]'), runs(p)]).toEqual(['block', true, true, [['opacity', 100], ['scale', 100]]]);
        await settled(p);
      }
      await expect.poll(() => p.querySelector('[data-date]')).toBe(null);
      expect(getComputedStyle(p).display).toBe('none');
      // From the keyboard (KW1): Alt+ArrowDown opens it at once, Escape takes it away at once.
      el('mo').focus();
      await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect([p.hidden, p.getAnimations().length, getComputedStyle(p).opacity]).toEqual([false, 0, '1']);
      await userEvent.keyboard('{Escape}');
      expect([p.hidden, getComputedStyle(p).display, p.getAnimations().length, document.activeElement]).toEqual([true, 'none', 0, el('mo')]);
    });
  });
});
