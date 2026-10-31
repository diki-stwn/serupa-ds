import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { Calendar } from '../components/Calendar/Calendar';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { DateRangePicker } from '../components/DateRangePicker/DateRangePicker';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { NumberInput } from '../components/NumberInput/NumberInput';

// A server in en-US and a browser in id-ID: the server HTML is made with the real Intl, then Intl's default locale
// becomes id-ID for the hydration and stays id-ID until done(), the way a visitor's browser would differ from the
// server. The browser says so with a languagechange event, as a real one does when its language changes: Serupa
// keeps the browser's locale until then (GR58). A render after the switch (WebKit can render once more after the
// first frames) has to see the same browser.
async function hydrateIn(browser: string, ui: React.ReactElement) {
  const host = document.createElement('div');
  host.innerHTML = renderToString(ui);
  document.body.appendChild(host);
  const Real = Intl.DateTimeFormat;
  const Fake = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) { return new Real(locales ?? browser, options); } as unknown as typeof Intl.DateTimeFormat;
  Object.assign(Fake, { supportedLocalesOf: Real.supportedLocalesOf, prototype: Real.prototype });
  const RealN = Intl.NumberFormat;
  const FakeN = function (locales?: string | string[], options?: Intl.NumberFormatOptions) { return new RealN(locales ?? browser, options); } as unknown as typeof Intl.NumberFormat;
  Object.assign(FakeN, { supportedLocalesOf: RealN.supportedLocalesOf, prototype: RealN.prototype });
  const errors: string[] = [], logError = console.error;
  console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); };
  let root: Root | undefined;
  const done = () => {
    root?.unmount(); host.remove();
    Intl.DateTimeFormat = Real; Intl.NumberFormat = RealN;
    window.dispatchEvent(new Event('languagechange'));
    console.error = logError;
  };
  try {
    Intl.DateTimeFormat = Fake; Intl.NumberFormat = FakeN;
    window.dispatchEvent(new Event('languagechange'));
    flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
    await new Promise((r) => setTimeout(r, 50));
  } catch (e) { done(); throw e; }
  return { host, errors, done };
}

describe('hydration without a locale', () => {
  test('the server HTML hydrates without a mismatch, then the fields switch to the browser\'s locale', async () => {
    const day = new Date(2026, 9, 23);
    const { host, errors, done } = await hydrateIn('id-ID', <div>
      <DatePicker id="dp" aria-label="Date" defaultValue={day} />
      <DateRangePicker id="drp" startLabel="From" endLabel="To" defaultValue={{ start: day, end: new Date(2026, 9, 25) }} />
      <TimePicker id="tp" aria-label="Time" defaultValue="14:30" />
      <Calendar id="cal" defaultValue={day} />
      <NumberInput id="ni" aria-label="Amount" defaultValue={1500.25} step={0.01} />
    </div>);
    try {
      expect(errors).toEqual([]);
      const dp = host.querySelector<HTMLInputElement>('#dp')!;
      // Placeholder and value agree, in the browser's day-month order.
      expect([dp.value, dp.placeholder]).toEqual(['23/10/2026', 'dd/mm/yyyy']);
      const ends = [...host.querySelectorAll<HTMLInputElement>('[data-component="date-range-picker"] input:not([type=hidden])')];
      expect(ends.map((e) => [e.value, e.placeholder])).toEqual([['23/10/2026', 'dd/mm/yyyy'], ['25/10/2026', 'dd/mm/yyyy']]);
      expect(host.querySelector<HTMLInputElement>('#tp')!.value).toBe('14.30');
      expect(host.querySelector('#cal')!.textContent).toContain('Oktober 2026');
      expect(host.querySelector<HTMLInputElement>('#ni')!.value).toBe('1500,25');
    } finally { done(); }
  });
});
