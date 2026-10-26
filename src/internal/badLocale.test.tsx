import * as React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Calendar } from '../components/Calendar/Calendar';
import { FormattedNumber, formatNumber } from '../components/FormattedNumber/FormattedNumber';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { RelativeTime, relativeTime } from '../components/RelativeTime/RelativeTime';
import { useCollator } from './collator';
import { SerupaProvider } from './provider';

// FS1: Intl throws RangeError on "en_US", so a locale from a server's LANG unmounted the whole tree.
function Sorted() {
  const c = useCollator();
  return <p>{['b', 'a10', 'a2'].sort(c.compare).join(' ')}</p>;
}
const ALL = () => (
  <>
    <FormattedNumber value={1234.5} />
    <Calendar defaultMonth={new Date(2026, 0, 1)} />
    <RelativeTime date={Date.now() - 3 * 86400000} />
    <NumberInput aria-label="Jumlah" defaultValue={1234.5} />
    <Sorted />
  </>
);

describe('A malformed locale (FS1)', () => {
  test('"id_ID" on the provider is read as id-ID by every Intl type, rather than throwing', async () => {
    const screen = await render(<SerupaProvider locale="id_ID"><ALL /></SerupaProvider>);
    await expect.element(screen.getByText('1.234,5')).toBeInTheDocument(); // NumberFormat
    await expect.element(screen.getByText(/januari 2026/i).first()).toBeInTheDocument(); // DateTimeFormat
    await expect.element(screen.getByText('3 hari yang lalu')).toBeInTheDocument(); // RelativeTimeFormat
    await expect.element(screen.getByLabelText('Jumlah')).toHaveValue('1234,5'); // NumberFormat's decimal mark, as typed
    await expect.element(screen.getByText('a2 a10 b')).toBeInTheDocument(); // Collator
  });

  test('a component\'s own "id_ID" is mended too, and its lang is the canonical tag', async () => {
    const screen = await render(<SerupaProvider locale="en-US"><FormattedNumber value={1234.5} locale="id_ID" /></SerupaProvider>);
    const el = screen.getByText('1.234,5');
    await expect.element(el).toBeInTheDocument();
    expect(el.element().getAttribute('lang')).toBe('id-ID');
  });

  test('one Intl can\'t read at all is skipped for the browser\'s, with one warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const screen = await render(<SerupaProvider locale="not a locale!"><ALL /><FormattedNumber value={98765} locale="en-" /></SerupaProvider>);
      const browser = new Intl.NumberFormat().format(1234.5);
      await expect.element(screen.getByText(browser)).toBeInTheDocument();
      await expect.element(screen.getByText(new Intl.NumberFormat().format(98765))).toBeInTheDocument();
      const said = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('bad-locale'));
      expect(said).toHaveLength(2);
      expect(said[0]).toContain('"not a locale!"');
    } finally {
      warn.mockRestore();
    }
  });

  test('formatNumber and relativeTime mend the locale they are given', () => {
    expect(formatNumber(1234.5, 'id_ID')).toBe('1.234,5');
    expect(formatNumber(1234.5, 'EN_us')).toBe('1,234.5');
    expect(relativeTime(Date.now() - 5 * 86400000, Date.now(), 'id_ID')).toBe('5 hari yang lalu');
  });
});
