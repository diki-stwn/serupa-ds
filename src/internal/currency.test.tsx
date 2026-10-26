import { describe, expect, test } from 'vitest';
import { minorDigits, pinCurrencyDigits, shownDigits } from './currency';

describe('currency', () => {
  test('minor units come from ISO 4217 and the shown decimals from CLDR: IDR is 2 and 0, JPY 0 and 0, KWD 3 and 3', () => {
    expect(['IDR', 'JPY', 'KWD', 'usd'].map((c) => [minorDigits(c), shownDigits(c)])).toEqual([[2, 0], [0, 0], [3, 3], [2, 2]]);
  });

  test('pinCurrencyDigits sets both fraction digits, so the engine\'s own CLDR is never asked (Safari wrote "Rp 150.000,00")', () => {
    const o: Intl.NumberFormatOptions = pinCurrencyDigits({ style: 'currency', currency: 'IDR' });
    expect([o.minimumFractionDigits, o.maximumFractionDigits, new Intl.NumberFormat('id-ID', o).format(150000).replace(/\s/g, ' ')]).toEqual([0, 0, 'Rp 150.000']);
    expect(new Intl.NumberFormat('en-US', pinCurrencyDigits({ style: 'currency', currency: 'USD' })).format(1.5)).toBe('$1.50');
  });

  test('options that already say how to round, compact ones and non-currency ones are left as they are', () => {
    const kept: Intl.NumberFormatOptions[] = [
      { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 },
      { style: 'currency', currency: 'IDR', minimumFractionDigits: 1 },
      { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 },
      { style: 'currency', currency: 'IDR', notation: 'compact' },
      { style: 'decimal' },
      { style: 'currency' },
    ];
    for (const o of kept) expect(pinCurrencyDigits(o)).toBe(o);
  });
});
