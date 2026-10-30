import { describe, expect, test } from 'vitest';
import { formatTime, parseTime } from './times';
import { WORLD_LOCALES } from '../../tools/test/vitest/locales';

const LOCALES = ['ko', 'ar-EG', 'fa', 'en-US', 'ja', 'zh-CN', 'zh-TW', 'hi-IN', 'bn', 'th', 'id', 'de', 'es', 'vi', 'el'];
const TIMES = [0, 5, 9 * 60 + 30, 12 * 60, 12 * 60 + 45, 14 * 60 + 5, 23 * 60 + 59];

describe('typed times', () => {
  test('typed in full width by a Japanese or Chinese IME: "１４：０５", "午後２：０５" and "２ＰＭ" read as they do in half width (L8E1)', () => {
    expect([parseTime('１４：０５', 'ja'), parseTime('午後２：０５', 'ja'), parseTime('２ＰＭ', 'en-US'), parseTime('下午２：０５', 'zh-CN')]).toEqual([845, 845, 840, 845]);
  });

  test.each(LOCALES)('%s: parseTime(formatTime(n)) is n, in the locale\'s own hour cycle, 12-hour and 24-hour', (locale) => {
    for (const n of TIMES) for (const h12 of [undefined, true, false]) {
      const text = formatTime(n, locale, h12);
      expect(parseTime(text, locale), `${locale} ${h12} ${text}`).toBe(n);
    }
  });

  test(`every time reads back in ${WORLD_LOCALES.length} locales, in the default, 12-hour and 24-hour forms`, () => {
    const bad: string[] = [];
    for (const locale of WORLD_LOCALES) for (const n of TIMES) for (const h12 of [undefined, true, false]) {
      const text = formatTime(n, locale, h12);
      if (parseTime(text, locale) !== n) bad.push(`${locale} ${h12} "${text}" → ${parseTime(text, locale)}`);
    }
    expect(bad).toEqual([]);
  });

  test('AM or PM before the time, and 0 as the first hour of a half; plain am/pm still once only', () => {
    expect([parseTime('AM 9.05', 'en-US'), parseTime('pm 2:05', 'en-US'), parseTime('午前0:00', 'ja'), parseTime('午後0:30', 'ja')]).toEqual([9 * 60 + 5, 14 * 60 + 5, 0, 12 * 60 + 30]);
    expect([parseTime('am 9', 'en-US'), parseTime('am9pm', 'en-US'), parseTime('13pm', 'en-US')]).toEqual([9 * 60, null, null]);
  });

  test('the locale\'s own forms: 오후 2:05, ٢:٠٥ م, ۱۴:۰۵, 午後2:05; plain forms keep working', () => {
    expect(parseTime('오후 2:05', 'ko')).toBe(845);
    expect(parseTime('오전 9:30', 'ko')).toBe(570);
    expect(parseTime('٢:٠٥ م', 'ar-EG')).toBe(845);
    expect(parseTime('۱۴:۰۵', 'fa')).toBe(845);
    expect(parseTime('午後2:05', 'ja')).toBe(845);
    for (const [t, n] of [['14:05', 845], ['2:05 pm', 845], ['2pm', 840], ['1405', 845], ['9', 540], ['9.30', 570], ['21h30', 1290], ['12am', 0]] as const) expect(parseTime(t, 'en-US'), t).toBe(n);
    for (const t of ['25:00', '9:75', '13pm', '오후 2pm', 'abc']) expect(parseTime(t, 'ko'), t).toBe(null);
  });
});
