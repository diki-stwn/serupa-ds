import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { SerupaProvider } from '../../internal/provider';
import { RelativeTime, relativeTime } from './RelativeTime';

const el = (id: string) => document.getElementById(id) as HTMLTimeElement;
const ago = (s: number) => Date.now() - s * 1000;
afterEach(() => { vi.useRealTimers(); });

describe('RelativeTime', () => {
  test('a <time datetime> saying how long ago, in words; the exact date as its tooltip; ref and props reach it', async () => {
    const ref = React.createRef<HTMLTimeElement>(), at = ago(3 * 60);
    await render(<SerupaProvider locale="en-US"><RelativeTime id="t1" date={at} ref={ref} className="extra" data-x="y" /></SerupaProvider>);
    const t = el('t1');
    expect([t.tagName, t.textContent, t.dateTime, t.title, ref.current === t, t.className, t.dataset.x, t.dataset.component])
      .toEqual(['TIME', '3 minutes ago', new Date(at).toISOString(), new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(at), true, 'dk-relative-time extra', 'y', 'relative-time']);
  });

  test('the unit follows the gap, past and future: now, minutes, hours, yesterday, days, months, years, in 2 hours', () => {
    const now = Date.UTC(2026, 9, 24, 12), at = (s: number) => now - s * 1000, f = (d: number) => relativeTime(d, now, 'en-US');
    expect([f(at(10)), f(at(-30)), f(at(50)), f(at(44 * 60)), f(at(46 * 60)), f(at(5 * 3600)), f(at(30 * 3600)), f(at(4 * 86400)), f(at(40 * 86400)), f(at(400 * 86400)), f(at(-2 * 3600))])
      .toEqual(['now', 'now', '1 minute ago', '44 minutes ago', '1 hour ago', '5 hours ago', 'yesterday', '4 days ago', 'last month', 'last year', 'in 2 hours']);
    expect([relativeTime(at(86400), now, 'en-US', { numeric: 'always' }), relativeTime(at(180), now, 'en-US', { format: 'short' }), relativeTime(at(180), now, 'en-US', { format: 'narrow' }), relativeTime('nope', now)])
      .toEqual(['1 day ago', '3 min. ago', new Intl.RelativeTimeFormat('en-US', { style: 'narrow' }).format(-3, 'minute'), '']);
  });

  test('a day on its own ("2026-10-24") is that local day, in days: today, yesterday, in 3 days; its datetime is the day (L8E13)', async () => {
    const L = (mo: number, d: number, h: number) => new Date(2026, mo, d, h).getTime();
    const f = (d: string, now: number, numeric?: 'always') => relativeTime(d, now, 'en-US', numeric ? { numeric } : undefined);
    expect([f('2026-10-24', L(9, 24, 14)), f('2026-10-23', L(9, 24, 0)), f('2026-10-27', L(9, 24, 23)), f('2026-10-23', L(9, 24, 14), 'always'), f('2026-09-20', L(9, 24, 14)), f('2026-02-30', L(9, 24, 14))])
      .toEqual(['today', 'yesterday', 'in 3 days', '1 day ago', 'last month', '']);
    // West of Greenwich, Date reads "2026-10-24" as 23 Oct in the evening.
    const offset = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);
    try { expect(f('2026-10-24', L(9, 24, 9))).toBe('today'); } finally { offset.mockRestore(); }
    // The page's one clock is the real one, so the day rendered is today's.
    const n = new Date(), today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    await render(<SerupaProvider locale="en-US"><RelativeTime id="tday" date={today} /></SerupaProvider>);
    const t = el('tday');
    expect([t.textContent, t.dateTime, t.title]).toEqual(['today', today, new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(n)]);
  });

  test('numeric auto counts yesterday, last month and last year on the viewer\'s calendar, not by elapsed time (GL2)', () => {
    // Local times: the viewer's calendar is the one that says what yesterday is.
    const L = (mo: number, d: number, h: number, mi = 0) => new Date(2026, mo, d, h, mi).getTime();
    const f = (d: number, now: number, numeric?: 'always') => relativeTime(d, now, 'en-US', numeric ? { numeric } : undefined);
    expect([
      f(L(9, 26, 1), L(9, 26, 23)),          // the same day, 22 hours before
      f(L(9, 24, 23, 30), L(9, 26, 1)),      // two calendar days back, 25.5 hours before
      f(L(9, 25, 9), L(9, 26, 8)),           // the day before, 23 hours before
      f(L(9, 1, 12), L(9, 27, 12)),          // the same month, 26 days before
      f(L(8, 30, 12), L(9, 27, 12)),         // the month before, 27 days before
      f(L(0, 5, 12), L(11, 20, 12)),         // the same year, 349 days before
      f(L(9, 27, 23), L(9, 26, 1)),          // 46 hours ahead, on the next calendar day
    ]).toEqual(['22 hours ago', '2 days ago', 'yesterday', '26 days ago', 'last month', '11 months ago', 'tomorrow']);
    // numeric always keeps elapsed time.
    expect(f(L(9, 26, 1), L(9, 26, 23), 'always')).toBe('1 day ago');
  });

  test('the words follow the locale: Indonesian, Arabic digits, Japanese', async () => {
    const at = ago(3 * 3600);
    await render(<>{['id-ID', 'ar-EG', 'ja-JP'].map((l) => <RelativeTime key={l} id={'l-' + l} locale={l} date={at} />)}</>);
    expect(['id-ID', 'ar-EG', 'ja-JP'].map((l) => el('l-' + l).textContent)).toEqual(['id-ID', 'ar-EG', 'ja-JP'].map((l) => new Intl.RelativeTimeFormat(l, { numeric: 'auto' }).format(-3, 'hour')));
  });

  test('it keeps up: one shared clock moves every RelativeTime on the page on the next 15-second tick', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const start = Date.now();
    await render(<SerupaProvider locale="en-US"><RelativeTime id="a" date={start - 40 * 1000} /><RelativeTime id="b" date={start - (44 * 60 + 50) * 1000} /></SerupaProvider>);
    expect([el('a').textContent, el('b').textContent]).toEqual(['now', '45 minutes ago']);
    await React.act(async () => { vi.advanceTimersByTime(15000); });
    expect([el('a').textContent, el('b').textContent]).toEqual(['1 minute ago', '1 hour ago']);
  });

  test('titleFormat changes or drops the tooltip; your own title wins; format and numeric reach the words', async () => {
    const at = ago(86400 + 60);
    await render(<SerupaProvider locale="en-US">
      <RelativeTime id="f1" date={at} titleFormat={{ dateStyle: 'short' }} numeric="always" />
      <RelativeTime id="f2" date={at} titleFormat={false} format="short" />
      <RelativeTime id="f3" date={at} title="Sent on Friday" />
    </SerupaProvider>);
    expect([el('f1').title, el('f1').textContent, el('f2').hasAttribute('title'), el('f2').textContent, el('f3').title])
      .toEqual([new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(at), '1 day ago', false, 'yesterday', 'Sent on Friday']);
  });

  test('more than absoluteAfter days away (7 by default), ago or ahead, it shows the date instead, in absoluteFormat; the tooltip stays; false keeps the words (KW8)', async () => {
    const day = 86400 * 1000, now = Date.now(), at = (d: number) => now - d * day;
    const med = (t: number) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(t);
    await render(<SerupaProvider locale="en-US">
      <RelativeTime id="w6" date={at(6)} numeric="always" />
      <RelativeTime id="w8" date={at(8)} />
      <RelativeTime id="w340" date={at(340)} />
      <RelativeTime id="wf" date={at(-30)} />
      <RelativeTime id="wn" date={at(340)} absoluteAfter={false} numeric="always" />
      <RelativeTime id="w2" date={at(3)} absoluteAfter={2} absoluteFormat={{ month: 'long', day: 'numeric' }} />
      <RelativeTime id="wid" date={at(340)} locale="id-ID" />
    </SerupaProvider>);
    expect(['w6', 'w8', 'w340', 'wf', 'wn', 'w2', 'wid'].map((id) => el(id).textContent)).toEqual([
      '6 days ago', med(at(8)), med(at(340)), med(at(-30)), '1 year ago',
      new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(at(3)), new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(at(340)),
    ]);
    expect([el('w340').title, el('w340').dateTime]).toEqual([new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(at(340)), new Date(at(340)).toISOString()]);
  });

  test('an invalid date renders an empty <time> without datetime, no errors, and one development warning naming the date (GL3)', async () => {
    const error = vi.spyOn(console, 'error'), warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<><RelativeTime id="bad" date="not a date" /><RelativeTime id="bad2" date="2026-13-45" /></>);
    expect([el('bad').textContent, el('bad').hasAttribute('datetime'), el('bad').hasAttribute('title')]).toEqual(['', false, false]);
    expect(error).not.toHaveBeenCalled();
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([expect.stringMatching(/^RelativeTime: date "not a date" isn't a date.*relative-time-date/)]);
    error.mockRestore(); warn.mockRestore();
  });

  test('server-rendered HTML hydrates without a mismatch error, then shows the browser\'s words', async () => {
    const at = Date.now() - 5 * 60 * 1000;
    const ui = <SerupaProvider locale="en-US"><RelativeTime id="ssr" date={at} /></SerupaProvider>;
    const host = document.createElement('div');
    host.innerHTML = renderToString(ui);
    document.body.appendChild(host);
    const errors: string[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await React.act(async () => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
    expect([errors, host.querySelector('time')!.textContent]).toEqual([[], '5 minutes ago']);
    // Unmounted, not only removed: a mounted RelativeTime keeps the shared clock running into the next test.
    React.act(() => root!.unmount());
    host.remove();
  });
  test('L8E97 a day on its own is cut off at absoluteAfter calendar days both ways: "7 days ago" and "in 7 days" stay words, 8 shows the date; 7 days ago showed the date, a day early', async () => {
    const d = new Date(), day = (n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    const med = (n: number) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
    await render(<SerupaProvider locale="en-US">
      {[-8, -7, 7, 8].map((n) => <RelativeTime key={n} id={'l8e97' + n} date={day(n)} />)}
    </SerupaProvider>);
    expect([-8, -7, 7, 8].map((n) => document.getElementById('l8e97' + n)!.textContent)).toEqual([med(-8), '7 days ago', 'in 7 days', med(8)]);
  });
});
