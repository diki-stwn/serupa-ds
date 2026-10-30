import { describe, expect, test } from 'vitest';
import { formatNumber, parseNumber } from './numbers';

describe('typed numbers', () => {
  test.each([
    ['en-US', '1,500', 1500], ['en-US', '1,500.25', 1500.25], ['en-US', '1.5', 1.5], ['en-US', '9,5', 9.5], ['en-US', '0,125', 0.125],
    ['id-ID', '1.000', 1000], ['id-ID', '1.500,25', 1500.25], ['id-ID', '9,5', 9.5], ['id-ID', '9.5', 9.5], ['id-ID', 'Rp 1.500', 1500],
    ['de-DE', '1.000', 1000], ['de-DE', '2.500.000', 2500000], ['de-DE', '1,000', 1], ['de-DE', '−3,5', -3.5],
    ['fr-FR', '1 000', 1000], ['fr-FR', '1 000,5', 1000.5], ['de-CH', '1’000.5', 1000.5],
    ['ar-EG', '١٬٥٠٠٫٢٥', 1500.25], ['fa', '۱۲٫۵', 12.5], ['en-US', '-$1,234.50', -1234.5], ['en-US', '15%', 15], ['en-US', '.5', 0.5],
  ])('%s: %s is %d', (locale, text, n) => {
    expect(parseNumber(text, locale)).toBe(n);
  });

  test('typed in full width by a Japanese or Chinese IME, the same number, sign included: "－１，５００．５" is -1500.5 (GR44)', () => {
    expect([parseNumber('１，５００．５', 'ja'), parseNumber('－５', 'ja'), parseNumber('－１２．５', 'zh-CN'), parseNumber('１５００', 'en-US')]).toEqual([1500.5, -5, -12.5, 1500]);
  });

  test('empty is null; half-typed or not a number is undefined', () => {
    expect(parseNumber('  ', 'en-US')).toBe(null);
    for (const t of ['-', '1.', 'abc', '1e5', '1.2.3,4', '1,2,3', '1-2']) expect(parseNumber(t, 'en-US'), t).toBe(undefined);
  });

  test.each(['en-US', 'id-ID', 'de-DE', 'fr-FR', 'de-CH', 'ar-EG', 'fa', 'hi-IN', 'ja'])('%s: parseNumber(formatNumber(n)) is n, with and without grouping or currency', (locale) => {
    for (const n of [0, 9.5, -3.25, 1500, 1234567.891, 0.001]) {
      expect(parseNumber(formatNumber(n, locale), locale), formatNumber(n, locale)).toBe(n);
      const g = formatNumber(n, locale, { useGrouping: true, maximumFractionDigits: 3 });
      expect(parseNumber(g, locale), g).toBe(n);
    }
    const c = formatNumber(1500, locale, { style: 'currency', currency: 'IDR' });
    expect(parseNumber(c, locale), c).toBe(1500);
  });

  test('a negative written the accounting way, in parentheses, or with a trailing minus stays negative', () => {
    expect([parseNumber('(1,234.50)', 'en-US'), parseNumber('1234.5-', 'en-US'), parseNumber('(Rp 1.500)', 'id-ID'), parseNumber('(15', 'en-US')]).toEqual([-1234.5, -1234.5, -1500, 15]);
    for (const locale of ['en-US', 'id-ID', 'de-DE']) {
      const t = formatNumber(-1500, locale, { style: 'currency', currency: 'IDR', currencySign: 'accounting' });
      expect(parseNumber(t, locale), t).toBe(-1500);
    }
  });

  test('unit abbreviations with dots (Thai, Nepali, Tamil) and Chinese numerals read back', () => {
    for (const locale of ['th', 'ne', 'ta', 'en-IN']) {
      const t = formatNumber(12.5, locale, { style: 'unit', unit: 'kilometer' });
      expect(parseNumber(t, locale), t).toBe(12.5);
    }
    const han = new Intl.NumberFormat('zh-u-nu-hanidec', { useGrouping: false }).format(2025);
    expect([han, parseNumber(han, 'zh')]).toEqual(['二〇二五', 2025]);
  });

  test('formatNumber: Latin digits and the locale\'s decimal mark, no grouping by default', () => {
    expect(formatNumber(1500.5, 'de-DE')).toBe('1500,5');
    expect(formatNumber(1500.5, 'id-ID', { useGrouping: true })).toBe('1.500,5');
    expect(formatNumber(12.5, 'ar-EG')).toMatch(/^12[.٫]5$/);
  });
});
