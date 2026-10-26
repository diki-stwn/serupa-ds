import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, withMotion } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
const described = (e: Element) => (e.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).map((i) => document.getElementById(i)!.textContent).join(' | ');
import { TimePicker } from './TimePicker';

const el = (id: string) => document.getElementById(id) as HTMLInputElement;
const announcerA = () => document.querySelector<HTMLElement>('[data-dk-announcer-assertive]');
const listOf = (id: string) => document.getElementById(el(id).getAttribute('aria-controls')!) as HTMLUListElement;
const button = (id: string) => document.querySelector(`#${id} ~ button`) as HTMLButtonElement;
const time = (o: Element | undefined | null) => (o ? o.querySelector('.dk-time-picker__time')!.textContent : undefined);
const st = (id: string) => {
  const i = el(id), l = listOf(id), act = i.getAttribute('aria-activedescendant');
  return { v: i.value, open: !l.hidden, exp: i.getAttribute('aria-expanded'), active: act ? time(document.getElementById(act)) : null, n: l.children.length, first: time(l.children[0]), last: time(l.children[l.children.length - 1]),
    hidden: [...l.querySelectorAll('[data-icon]')].every((x) => x.closest('[aria-hidden=true]')), sel: [...l.querySelectorAll<HTMLElement>('[aria-selected=true]')].map((o) => o.dataset.value).join() };
};
// Tab moves on to the "Next" button after each field: with nothing left to tab to, Firefox sends focus out of the
// test frame without a blur, and the typed text is read on blur.
const fill = async (id: string, text: string, key = '{Tab}') => { await userEvent.fill(el(id), text); await userEvent.keyboard(key); };

function Meeting(props: { tref?: React.Ref<HTMLInputElement> }) {
  return <div style={{ width: '240px' }}><Field label="Meeting"><TimePicker id="tp" locale="en-US" className="extra" ref={props.tref} /></Field><button id="next">Next</button></div>;
}
function Ctl(props: { changes: string[]; setRef?: { set?: (v: string | null) => void } }) {
  const [v, setV] = React.useState<string | null>('09:00');
  if (props.setRef) props.setRef.set = setV;
  return <><TimePicker id="ctl" aria-label="Start" value={v} onValueChange={(n) => { props.changes.push(String(n)); setV(n); }} min="08:00" max="18:00" step={15} name="start" locale="en-US" /><button id="next">Next</button></>;
}
const openTp = async () => { el('tp').focus(); await userEvent.keyboard('{ArrowDown}'); };

describe('TimePicker', () => {
  test('the placeholder and the format in the description come from the locale: hh:mm AM/PM (en-US), hh.mm (id-ID), 오전/오후 hh:mm (ko), after a Field hint', async () => {
    await render(<><Field label="Start" hint="Office hours"><TimePicker id="tus" locale="en-US" /></Field><TimePicker id="tid" aria-label="Mulai" locale="id-ID" /><TimePicker id="tko" aria-label="시작" locale="ko" /></>);
    const f = (id: string) => document.getElementById(id) as HTMLInputElement;
    expect(['tus', 'tid', 'tko'].map((id) => f(id).placeholder)).toEqual(['hh:mm AM/PM', 'hh.mm', '오전/오후 hh:mm']);
    expect([described(f('tus')), described(f('tid'))]).toEqual(['Office hours | Format: hh:mm AM/PM', 'Format: hh.mm']);
  });

  test('typed text it puts back is reported: onInvalidInput with "unreadable" or "unavailable", and screen readers hear it wasn\'t accepted', async () => {
    const calls: string[] = [];
    await render(<TimePicker id="tpi" locale="en-GB" defaultValue="09:00" min="08:00" max="18:00" onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    await fill('tpi', 'lunch');
    await fill('tpi', '22:00');
    expect([el('tpi').value, calls]).toEqual(['09:00', ['lunch:unreadable', '22:00:unavailable']]);
    await expect.poll(() => announcerA()?.textContent).toContain('"22:00" wasn\'t accepted');
  });

  test('a role="combobox" field (aria-haspopup="listbox", collapsed) in a dk-input box, labelled by Field; a "Choose a time" clock button out of the tab order; ref and className', async () => {
    const ref = React.createRef<HTMLInputElement>();
    await render(<Meeting tref={ref} />);
    const i = el('tp'), l = listOf('tp'), b = button('tp');
    expect(ref.current).toBe(i);
    expect(i.parentElement!.className).toMatch(/dk-input.*extra/);
    expect([i.getAttribute('role'), i.getAttribute('aria-haspopup'), i.getAttribute('aria-expanded'), i.placeholder]).toEqual(['combobox', 'listbox', 'false', 'hh:mm AM/PM']);
    expect([l.getAttribute('role'), l.getAttribute('aria-label'), b.getAttribute('aria-label'), b.tabIndex]).toEqual(['listbox', 'Choose a time', 'Choose a time', -1]);
    expect(document.querySelector('label')!.htmlFor).toBe('tp');
  });

  test('ArrowDown opens a list of every 30 minutes in the locale\'s format (12:00 AM … 11:30 PM); arrows move one time, PageDown four; Ctrl+End and Ctrl+Home go to the last and first times', async () => {
    await render(<Meeting />);
    await openTp();
    const o = st('tp');
    expect([o.open, o.exp, o.n, o.first, o.last, o.active]).toEqual([true, 'true', 48, '12:00 AM', '11:30 PM', '12:00 AM']);
    await userEvent.keyboard('{ArrowDown}{PageDown}{ArrowUp}');
    expect(st('tp').active).toBe('2:00 AM');
    await userEvent.keyboard('{Control>}{End}{/Control}');
    expect(st('tp').active).toBe('11:30 PM');
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    expect(st('tp').active).toBe('12:00 AM');
  });

  test('keyboard table: PageUp goes four times up the list, as PageDown goes down (FH1)', async () => {
    await render(<Meeting />);
    await openTp();
    await userEvent.keyboard('{PageDown}{PageDown}{PageUp}');
    expect(st('tp').active).toBe('2:00 AM');
  });

  test('Enter picks the highlighted time, closes the list and keeps focus in the field; reopening highlights and checks it (the check hidden from screen readers); Escape closes the list', async () => {
    await render(<Meeting />);
    await openTp();
    await userEvent.keyboard('{PageDown}{PageDown}{Enter}');
    const p = st('tp');
    expect([p.v, p.open, document.activeElement!.id]).toEqual(['4:00 AM', false, 'tp']);
    await userEvent.keyboard('{ArrowDown}');
    const r = st('tp');
    expect([r.active, r.sel, r.hidden, document.querySelectorAll('#tp ~ ul .dk-time-picker__check').length]).toEqual(['4:00 AM', '04:00', true, 1]);
    await userEvent.keyboard('{Escape}');
    expect(st('tp').open).toBe(false);
  });

  test('the clock button opens it; a click picks a time', async () => {
    await render(<Meeting />);
    await userEvent.click(button('tp'));
    await userEvent.click(document.querySelector('#tp ~ ul [data-value="13:30"]')!);
    expect([st('tp').v, st('tp').open]).toEqual(['1:30 PM', false]);
  });

  test('typing is read on blur: "2:45 pm", "1430", "9p", "07:05", "18:20", "12am"; "25:00" and "nonsense" put back the last good time; opening after typing highlights the nearest time; Tab closes the list and reads the text; clearing clears the value', async () => {
    await render(<Meeting />);
    const seen: string[] = [];
    for (const s of ['2:45 pm', '1430', '9p', '07:05', '18:20', '12am', '25:00', 'nonsense']) { await fill('tp', s); seen.push(el('tp').value); }
    expect(seen).toEqual(['2:45 PM', '2:30 PM', '9:00 PM', '7:05 AM', '6:20 PM', '12:00 AM', '12:00 AM', '12:00 AM']);
    await fill('tp', '8:10', '{ArrowDown}');
    expect(st('tp').active).toBe('8:00 AM');
    await userEvent.keyboard('{Tab}');
    expect([st('tp').open, el('tp').value]).toEqual([false, '8:10 AM']);
    await fill('tp', '');
    expect(el('tp').value).toBe('');
  });

  test('min, max and step: 8:00 AM to 6:00 PM every 15 minutes, opening at the value; controlled: onValueChange gets "HH:mm" and the hidden input follows; a time after max puts back the value; one off the step is kept; a new value from outside rewrites the field', async () => {
    const changes: string[] = [], setRef: { set?: (v: string | null) => void } = {};
    await render(<Ctl changes={changes} setRef={setRef} />);
    expect(el('ctl').value).toBe('9:00 AM');
    el('ctl').focus();
    await userEvent.keyboard('{ArrowDown}');
    const c = st('ctl');
    expect([c.n, c.first, c.last, c.active]).toEqual([41, '8:00 AM', '6:00 PM', '9:00 AM']);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    const hid = () => document.querySelector<HTMLInputElement>('input[type=hidden][name=start]')!.value;
    expect([changes.join(), hid()]).toEqual(['09:15', '09:15']);
    await fill('ctl', '7:30 pm');
    expect([el('ctl').value, changes.length]).toEqual(['9:15 AM', 1]);
    await fill('ctl', '10:07');
    expect(hid()).toBe('10:07');
    React.act(() => setRef.set!('17:45'));
    await expect.poll(() => el('ctl').value).toBe('5:45 PM');
  });

  test('de-DE: 24-hour times (00:00 … 23:30) and placeholder "hh:mm"', async () => {
    await render(<TimePicker id="de" aria-label="Beginn" locale="de-DE" defaultValue="14:30" />);
    el('de').focus();
    await userEvent.keyboard('{ArrowDown}');
    const d = st('de');
    expect([d.v, d.first, d.last, el('de').placeholder]).toEqual(['14:30', '00:00', '23:30', 'hh:mm']);
  });

  test('ko, ar-EG, fa: a time in the locale\'s own form is read on blur (오후 2:05, ٢:٠٥ م, ۱۴:۰۵), and a blur on the written time keeps it', async () => {
    const changes: string[] = [];
    await render(<div style={{ width: '240px' }}>{['ko', 'ar-EG', 'fa'].map((l, i) => <TimePicker key={l} id={`t${i}`} aria-label={l} locale={l} onValueChange={(v) => changes.push(l + ' ' + v)} />)}<button id="next">Next</button></div>);
    await fill('t0', '오후 2:05');
    await fill('t1', '٢:٠٥ م');
    await fill('t2', '۱۴:۰۵');
    expect(changes).toEqual(['ko 14:05', 'ar-EG 14:05', 'fa 14:05']);
    const written = [0, 1, 2].map((i) => el(`t${i}`).value);
    for (const i of [0, 1, 2]) { await userEvent.click(el(`t${i}`)); await userEvent.keyboard('{Escape}{Tab}'); }
    expect([0, 1, 2].map((i) => el(`t${i}`).value)).toEqual(written);
    expect(changes.length).toBe(3);
  });

  test('disabled: the field and button are disabled and faded', async () => {
    await render(<TimePicker id="dis" aria-label="Off" disabled defaultValue="10:00" />);
    expect([el('dis').disabled, el('dis').parentElement!.querySelector('button')!.disabled]).toEqual([true, true]);
    await expect.poll(() => getComputedStyle(el('dis').parentElement!).opacity).toBe('0.5');
  });

  test('contrast: times 4.5:1 (also highlighted), the check and clock icon 3:1, in all six themes', async () => {
    await render(<Ctl changes={[]} />);
    el('ctl').focus();
    await userEvent.keyboard('{ArrowDown}');
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const l = listOf('ctl'), bg = getComputedStyle(l).backgroundColor, act = l.querySelector('.dk-time-picker__option--active')!, opt = l.querySelector('.dk-time-picker__option:not(.dk-time-picker__option--active)')!, chk = l.querySelector('.dk-time-picker__check')!, btn = button('ctl');
      const chkBg = getComputedStyle(chk.parentElement!).backgroundColor;
      const pairs: Array<[string, string, string, number]> = [['time', getComputedStyle(opt).color, bg, 4.5], ['highlighted time', getComputedStyle(act).color, getComputedStyle(act).backgroundColor, 4.5], ['check', getComputedStyle(chk).color, chkBg === 'rgba(0, 0, 0, 0)' ? bg : chkBg, 3], ['clock icon', getComputedStyle(btn).color, getComputedStyle(btn.parentElement!).backgroundColor, 3]];
      for (const [k, fg, on, min] of pairs) { const r = contrast(fg, on); n++; if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    still.remove();
    expect(low).toEqual([]);
    expect(n).toBe(24);
  });

  test('--time-picker-option-bg-active overrides one picker', async () => {
    await render(<TimePicker id="tok" aria-label="Tok" style={{ '--time-picker-option-bg-active': 'rgb(1, 2, 3)' } as React.CSSProperties} />);
    el('tok').focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => getComputedStyle(document.querySelector('#tok ~ ul .dk-time-picker__option--active')!).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('typing with the list open moves the highlight to the nearest time, and Enter keeps what was typed; after typing, moving with the arrows makes Enter pick the highlighted time again', async () => {
    await render(<Meeting />);
    await userEvent.click(el('tp'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await userEvent.keyboard('3:15 pm');
    const ty = st('tp');
    expect([ty.open, ty.active]).toEqual([true, '3:00 PM']);
    await userEvent.keyboard('{Enter}');
    expect([st('tp').v, st('tp').open]).toEqual(['3:15 PM', false]);
    await userEvent.fill(el('tp'), '');
    await userEvent.keyboard('9a{ArrowDown}{ArrowDown}{Enter}');
    expect(el('tp').value).toBe('9:30 AM');
  });

  test('the clock button keeps focus in the field (no blur, half-typed text left alone); the list counts steps from min, like <input type="time">: 8:10, 8:40 … 9:40 AM; it is at least as wide as the field', async () => {
    let blurs = 0;
    await render(<div style={{ width: '240px' }}><TimePicker id="mn" aria-label="From min" locale="en-US" min="08:10" max="10:00" onBlur={() => { blurs++; }} /></div>);
    await userEvent.click(el('mn'));
    await userEvent.keyboard('8:4');
    await userEvent.click(button('mn'));
    expect([blurs, document.activeElement!.id, el('mn').value]).toEqual([0, 'mn', '8:4']);
    const m = st('mn');
    expect([m.first, m.last, m.n]).toEqual(['8:10 AM', '9:40 AM', 4]);
    expect(Math.round(listOf('mn').getBoundingClientRect().width)).toBeGreaterThanOrEqual(Math.round(el('mn').parentElement!.getBoundingClientRect().width));
  });

  test('a step under one minute falls back to 30', async () => {
    await render(<TimePicker id="tiny" aria-label="Tiny step" locale="en-US" step={0.25} />);
    await userEvent.click(el('tiny'));
    await userEvent.keyboard('{ArrowDown}');
    expect([st('tiny').open, st('tiny').n]).toEqual([true, 48]);
  });

  test('a new locale rewrites the field in its format', async () => {
    let setLoc: (l: string) => void = () => {};
    function Loc() { const [l, set] = React.useState('en-US'); setLoc = set; return <TimePicker id="loc" aria-label="Locale" locale={l} defaultValue="14:30" />; }
    await render(<Loc />);
    expect(el('loc').value).toBe('2:30 PM');
    React.act(() => setLoc('de-DE'));
    await expect.poll(() => el('loc').value).toBe('14:30');
  });
});

describe('TimePicker: autocomplete', () => {
  test('off by default; a passed autoComplete reaches the field', async () => {
    await render(<><TimePicker id="tpac" aria-label="Start" /><TimePicker id="tpon" aria-label="Arrival" autoComplete="on" /></>);
    expect([document.getElementById('tpac')!.getAttribute('autocomplete'), document.getElementById('tpon')!.getAttribute('autocomplete')]).toEqual(['off', 'on']);
  });

  test('entry: the list fades in and grows from its top edge with a transition, not keyframes (EF1)', async () => {
    await withMotion(async () => {
      await render(<Meeting />);
      await openTp();
      const list = document.getElementById(el('tp').getAttribute('aria-controls')!) as HTMLElement;
      const moves = list.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.transitionProperty).sort();
      expect([moves, list.getAnimations().some((a) => a instanceof CSSAnimation), list.dataset.side, css(list).transformOrigin.split(' ')[1]]).toEqual([['opacity', 'scale'], false, 'bottom', '0px']);
      await Promise.all(list.getAnimations().map((a) => a.finished));
      expect([css(list).opacity, css(list).scale]).toEqual(['1', 'none']);
    });
  });
});
