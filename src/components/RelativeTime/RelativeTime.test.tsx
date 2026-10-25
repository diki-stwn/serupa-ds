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

  test('an invalid date renders an empty <time> without datetime, and no errors', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<RelativeTime id="bad" date="not a date" />);
    expect([el('bad').textContent, el('bad').hasAttribute('datetime'), el('bad').hasAttribute('title')]).toEqual(['', false, false]);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
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
});
