import { describe, expect, test } from 'vitest';
import { datePattern, formatDate, parseDate } from './dates';
import { latinDigits } from './digits';
import { WORLD_LOCALES } from '../../tools/test/vitest/locales';

const LOCALES = ['th', 'th-TH-u-nu-thai', 'ja-u-ca-japanese', 'fa', 'ar-EG', 'ar-SA', 'bn', 'hi-IN-u-nu-deva', 'id', 'de', 'en-US', 'en-GB', 'ko', 'zh-CN'];
const DAYS = [new Date(2001, 10, 22), new Date(2025, 0, 5), new Date(2024, 1, 29), new Date(1999, 11, 31)];

describe('typed dates', () => {
  test.each(LOCALES)('%s: parseDate(formatDate(d)) is the same day, written in Gregorian years with Latin digits', (locale) => {
    for (const d of DAYS) {
      const text = formatDate(d, locale);
      expect(text, text).toMatch(/^[‎‏؜]?[0-9]/);
      expect(text).toContain(String(d.getFullYear()));
      expect(parseDate(text, locale)?.toDateString(), `${locale} ${text}`).toBe(d.toDateString());
    }
    expect(datePattern(locale)).toMatch(/dd/);
  });

  test(`every date reads back in ${WORLD_LOCALES.length} locales; a locale that writes its year first keeps its own order (ky)`, () => {
    const bad: string[] = [];
    for (const locale of WORLD_LOCALES) for (const d of [...DAYS, new Date(2026, 0, 5)]) {
      const text = formatDate(d, locale);
      if (parseDate(text, locale)?.toDateString() !== d.toDateString()) bad.push(`${locale} "${text}" → ${parseDate(text, locale)?.toDateString()}`);
    }
    expect(bad).toEqual([]);
    expect(parseDate('2001-11-22', 'de')?.toDateString()).toBe(new Date(2001, 10, 22).toDateString());   // ISO still reads
  });

  test('digits typed in other scripts are read: Arabic-Indic, Persian, Bengali, Thai, Devanagari, full-width', () => {
    expect(latinDigits('٢٢/١١/٢٠٠١ ۲۲ ২২ ๒๒ २२ ２２ 22')).toBe('22/11/2001 22 22 22 22 22 22');
    expect(parseDate('٢٢/١١/٢٠٠١', 'ar-EG')?.toDateString()).toBe(new Date(2001, 10, 22).toDateString());
    expect(parseDate('۲۰۰۱/۱۱/۲۲', 'fa')?.toDateString()).toBe(new Date(2001, 10, 22).toDateString());
    expect(parseDate('২২/১১/২০০১', 'bn')?.toDateString()).toBe(new Date(2001, 10, 22).toDateString());
  });

  test('L8E8: a month written as a word, as dates are pasted from an email: in the locale or in English, in full or cut short', () => {
    const iso = (t: string, locale: string) => { const d = parseDate(t, locale); return d && `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
    expect([
      iso('12 Mei 2025', 'id'), iso('12 Des 2025', 'id'), iso('May 12, 2025', 'en-US'), iso('12 May 2025', 'en-GB'), iso('Sept 3, 2025', 'en-US'),
      iso('12. März 2025', 'de'), iso('12 мая 2025 г.', 'ru'), iso('3 de septiembre de 2025', 'es'), iso('Monday, May 12, 2025', 'en-US'), iso('12 May 2025', 'id'),
    ]).toEqual(['2025-5-12', '2025-12-12', '2025-5-12', '2025-5-12', '2025-9-3', '2025-3-12', '2025-5-12', '2025-9-3', '2025-5-12', '2025-5-12']);
    expect([parseDate('May 2025', 'en-US'), parseDate('31 Feb 2025', 'en-US'), parseDate('Ma 12 2025', 'en-US')]).toEqual([null, null, null]);
  });
  test('a two-digit year is the one within 50 years of now: birth dates go back, deadlines go forward; four digits are kept', () => {
    const y = (text: string, now: Date) => parseDate(text, 'en-US', now)?.getFullYear();
    const in2026 = new Date(2026, 9, 25), in2081 = new Date(2081, 0, 1);
    expect(['1/2/85', '1/2/30', '1/2/26', '1/2/75', '1/2/76', '1/2/77', '1/2/0', '1/2/5'].map((t) => y(t, in2026))).toEqual([1985, 2030, 2026, 2075, 1976, 1977, 2000, 2005]);
    expect(['1/2/85', '1/2/30', '1/2/31', '1/2/32'].map((t) => y(t, in2081))).toEqual([2085, 2130, 2031, 2032]);
    expect(parseDate('22.11.85', 'de-DE', in2026)?.toDateString()).toBe(new Date(1985, 10, 22).toDateString());
    expect([y('1/2/2085', in2026), y('1/2/1930', in2026), y('1/2/0085', in2026)]).toEqual([2085, 1930, 85]);
    expect(parseDate('2/29/00', 'en-US', in2026)?.toDateString()).toBe(new Date(2000, 1, 29).toDateString());   // 2000 is a leap year
    expect(parseDate('2/29/01', 'en-US', in2026)).toBeNull();
  });

  test('digits alone, as typed on a keypad: 8 or 6 split in the locale\'s order, or ISO yyyymmdd when that order makes no date; other lengths aren\'t read', () => {
    const now = new Date(2026, 9, 25), day = (text: string, locale: string) => parseDate(text, locale, now)?.toDateString() ?? null;
    const nov22 = new Date(2001, 10, 22).toDateString();
    expect([day('11222001', 'en-US'), day('112201', 'en-US'), day('22112001', 'de-DE'), day('221101', 'de-DE'), day('20011122', 'en-US'), day('20011122', 'de-DE')]).toEqual([nov22, nov22, nov22, nov22, nov22, nov22]);
    expect([day('20011122', 'ja-JP'), day('٢٢١١٢٠٠١', 'ar-EG')]).toEqual([nov22, nov22]);
    expect([day('13452001', 'en-US'), day('1122001', 'en-US'), day('2211', 'de-DE'), day('112220011', 'en-US')]).toEqual([null, null, null, null]);
  });
});
