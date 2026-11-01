import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Calendar } from '../components/Calendar/Calendar';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { FormattedNumber } from '../components/FormattedNumber/FormattedNumber';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { RelativeTime } from '../components/RelativeTime/RelativeTime';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { SerupaProvider } from './provider';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const langOf = (n: Element | null) => n?.getAttribute('lang') ?? null;

// Text a component writes in its own locale prop carries lang, so a screen reader reads it in that language's
// voice; text in the page's locale doesn't, and words from labels (buttons, names) keep the page's (F13).
describe('lang on text in a locale of its own', () => {
  test('set where the locale prop differs from the provider\'s, not where it matches or is unset', async () => {
    await render(<SerupaProvider locale="en-US"><div>
      <FormattedNumber id="fn" value={1234.5} locale="id-ID" />
      <FormattedNumber id="fn2" value={1234.5} locale="en-us" />
      <FormattedNumber id="fn3" value={1234.5} />
      <RelativeTime id="rt" date={Date.now() - 86400000} locale="id-ID" />
      <Calendar id="cal" locale="id-ID" defaultMonth={new Date(2026, 0, 1)} />
      <DatePicker id="dp" locale="id-ID" aria-label="Tanggal" />
      <TimePicker id="tp" locale="id-ID" aria-label="Jam" />
      <NumberInput id="ni" locale="id-ID" aria-label="Jumlah" />
      <NumberInput id="ni2" locale="id-ID" lang="ms" aria-label="Jumlah" />
    </div></SerupaProvider>);
    expect([langOf(el('fn')), langOf(el('fn2')), langOf(el('fn3')), langOf(el('rt'))]).toEqual(['id-ID', null, null, 'id-ID']);
    const cal = el('cal');
    expect([langOf(cal), langOf(cal.querySelector('[aria-live]')), langOf(cal.querySelector('table')), langOf(cal.querySelector('button'))]).toEqual([null, 'id-ID', 'id-ID', null]);
    expect([langOf(el('dp')), langOf(el('tp')), langOf(el('ni')), langOf(el('ni2'))]).toEqual(['id-ID', 'id-ID', 'id-ID', 'ms']);   // your own lang wins
  });
});
