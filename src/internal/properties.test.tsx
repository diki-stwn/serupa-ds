import { describe, expect, test } from 'vitest';
import { formatNumber, parseNumber } from './numbers';
import { formatDate, parseDate } from './dates';
import { formatTime, parseTime } from './times';
import { PHONE_COUNTRIES, formatPhone, parsePhone, toE164 } from '../components/PhoneInput/phone';
import { WORLD_LOCALES } from '../../tools/test/vitest/locales';

// Property tests (J2): the round trips the fixed-value tests check, over many random values. The values come from
// a seeded generator, so a failure names its seed and the same values come back on the next run.
const SEED = 20261026;
function random(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// A number with up to 4 decimals, from 0.0001 to about ten billion, either sign.
function number(r: () => number): number {
  // Written out and read as one decimal, so the value is the double nearest it (a sum would add its own error).
  const whole = r() < 0.2 ? 0 : Math.floor(Math.pow(10, r() * 10)), frac = Array.from({ length: int(r, 0, 4) }, () => int(r, 0, 9)).join("");
  return Number((r() < 0.3 ? "-" : "") + whole + (frac ? "." + frac : ""));
}

describe(`round trips over random values (seed ${SEED})`, () => {
  test(`numbers: parseNumber reads back what formatNumber writes, and the grouped form in the locale's own digits, in ${WORLD_LOCALES.length} locales`, () => {
    const r = random(SEED), bad: string[] = [];
    for (const locale of WORLD_LOCALES) for (let i = 0; i < 40; i++) {
      const n = number(r);
      // Its own form, the grouped form with Latin digits, and as the locale shows it (its own digits, as pasted from a page).
      for (const text of [formatNumber(n, locale), formatNumber(n, locale, { maximumFractionDigits: 4 }), new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(n)]) {
        if (parseNumber(text, locale) !== n) bad.push(`${locale} ${n} "${text}" → ${parseNumber(text, locale)}`);
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });

  test(`dates: parseDate reads back formatDate for days from 1900 to 2099, in ${WORLD_LOCALES.length} locales`, () => {
    const r = random(SEED + 1), bad: string[] = [];
    for (const locale of WORLD_LOCALES) for (let i = 0; i < 20; i++) {
      const d = new Date(int(r, 1900, 2099), int(r, 0, 11), int(r, 1, 28));
      const text = formatDate(d, locale);
      if (parseDate(text, locale)?.toDateString() !== d.toDateString()) bad.push(`${locale} ${d.toDateString()} "${text}" → ${parseDate(text, locale)?.toDateString()}`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });

  test(`times: parseTime reads back formatTime for any minute of the day, 12- and 24-hour, in ${WORLD_LOCALES.length} locales`, () => {
    const r = random(SEED + 2), bad: string[] = [];
    for (const locale of WORLD_LOCALES) for (let i = 0; i < 20; i++) {
      const n = int(r, 0, 24 * 60 - 1);
      for (const h12 of [undefined, true, false]) {
        const text = formatTime(n, locale, h12);
        if (parseTime(text, locale) !== n) bad.push(`${locale} ${h12} ${n} "${text}" → ${parseTime(text, locale)}`);
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });

  test(`phones: parsePhone reads back formatPhone, the same country and number, for every one of the ${PHONE_COUNTRIES.length} countries`, () => {
    const r = random(SEED + 3), bad: string[] = [];
    for (const c of PHONE_COUNTRIES) {
      const others = PHONE_COUNTRIES.filter((o) => o.dial === c.dial && o !== c).flatMap((o) => o.areas || []);
      for (let i = 0; i < 10; i++) {
        let national = c.areas ? c.areas[int(r, 0, c.areas.length - 1)] : String(int(r, 1, 9));
        if (c.trunk && national.startsWith(c.trunk)) continue;
        while (national.length < int(r, Math.max(c.min, national.length), c.max)) national += String(int(r, 0, 9));
        // A number that starts with another country's area on the same calling code is that country's.
        if (others.some((a) => national.startsWith(a))) continue;
        const e164 = toE164(national, c), text = formatPhone(e164, c.code), p = parsePhone(text, c.code);
        if (!p || p.country.code !== c.code || toE164(p.national, p.country) !== e164) bad.push(`${c.code} ${e164} "${text}" → ${p ? p.country.code + " " + p.national : p}`);
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });
});
