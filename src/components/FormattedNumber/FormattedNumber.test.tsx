import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { SerupaProvider } from '../../internal/provider';
import { FormattedNumber, formatNumber } from './FormattedNumber';

const el = (id: string) => document.getElementById(id) as HTMLDataElement;
const nf = (l: string, o: Intl.NumberFormatOptions, v: number) => new Intl.NumberFormat(l, o).format(v);

describe('FormattedNumber', () => {
  test('a <data value> with the number in the provider locale\'s words; ref and props reach it', async () => {
    const ref = React.createRef<HTMLDataElement>();
    await render(<SerupaProvider locale="id-ID"><FormattedNumber id="n1" value={1234.5} ref={ref} className="extra" data-x="y" /></SerupaProvider>);
    const n = el('n1');
    expect([n.tagName, n.textContent, n.value, ref.current === n, n.className, n.dataset.x, n.dataset.component, n.dataset.format, n.hasAttribute('title')])
      .toEqual(['DATA', '1.234,5', '1234.5', true, 'dk-formatted-number extra', 'y', 'formatted-number', 'decimal', false]);
  });

  // IDR shows no decimals in every engine (currency.ts pins it); WebKit's own default for IDR is two.
  test('each format: compact, percent, currency, bytes, unit', () => {
    const f = (v: number, o: Parameters<typeof formatNumber>[2]) => formatNumber(v, 'en-US', o);
    expect([f(1234567, { format: 'compact' }), f(0.456, { format: 'percent' }), f(150000, { format: 'currency', currency: 'IDR' }), f(19.5, { format: 'currency', currency: 'JPY' }),
      f(50, { format: 'unit', unit: 'kilometer-per-hour' }), f(1234.5, {})])
      .toEqual(['1.2M', '46%', nf('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }, 150000), '¥20', '50 km/h', '1,234.5']);
  });

  test('bytes step by 1024 like formatFileSize: one decimal under 10, none above or for bytes; negatives keep their sign', () => {
    const b = (v: number) => formatNumber(v, 'en-US', { format: 'bytes' });
    expect([b(0), b(12), b(1023), b(1536), b(840000), b(1572864), b(5 * 1024 ** 3), b(3 * 1024 ** 6), b(-2048)])
      .toEqual([nf('en-US', { style: 'unit', unit: 'byte', unitDisplay: 'short' }, 0), nf('en-US', { style: 'unit', unit: 'byte', unitDisplay: 'short' }, 12), nf('en-US', { style: 'unit', unit: 'byte', unitDisplay: 'short' }, 1023),
        '1.5 kB', '820 kB', '1.5 MB', '5 GB', '3,072 PB', '-2 kB']);
  });

  test('options win over the format\'s own; a currency or unit format without its code writes a plain number, and an empty unit or currency is ignored; NaN is empty', () => {
    expect([formatNumber(0.031, 'en-US', { format: 'percent', signDisplay: 'always', maximumFractionDigits: 1 }), formatNumber(1572864, 'en-US', { format: 'bytes', maximumFractionDigits: 2 }),
      formatNumber(150000, 'en-US', { format: 'currency', currency: 'IDR', maximumFractionDigits: 0 }), formatNumber(1234567, 'en-US', { format: 'compact', compactDisplay: 'long' }),
      formatNumber(1234, 'en-US', { format: 'currency' }), formatNumber(1234, 'en-US', { format: 'unit' }), formatNumber(NaN, 'en-US'), formatNumber(12345678901234567890n, 'en-US'), formatNumber(5, 'en-US', { unit: '', currency: '' })])
      .toEqual(['+3.1%', '1.5 MB', nf('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }, 150000), '1.2 million', '1,234', '1,234', '', new Intl.NumberFormat('en-US').format(12345678901234567890n), '5']);
  });

  test('the words and digits follow the locale: Indonesian, German, Egyptian Arabic, Hindi', async () => {
    const ls = ['id-ID', 'de-DE', 'ar-EG', 'hi-IN'];
    await render(<>{ls.map((l) => <FormattedNumber key={l} id={'l-' + l} locale={l} value={1234567.89} />)}</>);
    expect(ls.map((l) => el('l-' + l).textContent)).toEqual(ls.map((l) => nf(l, {}, 1234567.89)));
    expect(formatNumber(1234, 'id-ID', { format: 'compact' })).toBe(nf('id-ID', { notation: 'compact' }, 1234));
  });

  test('props reach the words: format, currency, unit, options; a compact number has the full one as its tooltip, and your own title wins', async () => {
    await render(<SerupaProvider locale="en-US">
      <FormattedNumber id="c" value={1234567} format="compact" />
      <FormattedNumber id="c2" value={1234567} format="compact" title="Views this month" />
      <FormattedNumber id="m" value={9.99} format="currency" currency="EUR" options={{ currencyDisplay: 'code' }} />
      <FormattedNumber id="u" value={21} format="unit" unit="celsius" />
    </SerupaProvider>);
    expect([el('c').textContent, el('c').title, el('c').dataset.format, el('c2').title, el('m').textContent, el('u').textContent])
      .toEqual(['1.2M', '1,234,567', 'compact', 'Views this month', nf('en-US', { style: 'currency', currency: 'EUR', currencyDisplay: 'code' }, 9.99), nf('en-US', { style: 'unit', unit: 'celsius', unitDisplay: 'short' }, 21)]);
  });

  test('NaN renders an empty <data> without errors; it renders the same on the server', async () => {
    const error = vi.spyOn(console, 'error');
    await render(<FormattedNumber id="nan" value={NaN} format="compact" />);
    expect([el('nan').textContent, el('nan').hasAttribute('title')]).toEqual(['', false]);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
    expect(renderToString(<SerupaProvider locale="en-US"><FormattedNumber value={0.5} format="percent" /></SerupaProvider>)).toContain('>50%</data>');
  });
});

describe('FormattedNumber: bad options, speed and byte rounding (FT1)', () => {
  test('a currency, unit or digits Intl rejects writes the plain number with one warning, rather than throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(formatNumber(1234.5, 'en-US', { format: 'currency', currency: 'US' })).toBe('1,234.5');
      expect(formatNumber(80, 'en-US', { format: 'unit', unit: 'km/h' })).toBe('80');
      expect(formatNumber(2, 'en-US', { minimumFractionDigits: 3, maximumFractionDigits: 1 })).toBe('2');
      formatNumber(1234.5, 'en-US', { format: 'currency', currency: 'US' });
      const screen = await render(<FormattedNumber value={9} format="currency" currency="EURO" locale="en-US" />);
      await expect.element(screen.getByText('9')).toBeInTheDocument();
      expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('number-options'))).toHaveLength(4);
    } finally {
      warn.mockRestore();
    }
  });

  test('one formatter per locale and options: thousands of formats build it once', () => {
    const Real = Intl.NumberFormat;
    let built = 0;
    const Counting = function (l?: string | string[], o?: Intl.NumberFormatOptions) { built++; return new Real(l, o); } as unknown as typeof Intl.NumberFormat;
    Object.assign(Counting, { supportedLocalesOf: Real.supportedLocalesOf, prototype: Real.prototype });
    Intl.NumberFormat = Counting;
    try {
      // Options no other test uses, so the count doesn't depend on what ran before.
      for (let i = 0; i < 5000; i++) formatNumber(i, 'id-ID', { format: 'compact', minimumSignificantDigits: 2 });
      formatNumber(1, 'id-ID', { format: 'percent', minimumSignificantDigits: 2 });
    } finally {
      Intl.NumberFormat = Real;
    }
    expect(built).toBe(2);
  });

  test('bytes step up when the rounded number reaches 1024, and fractional bytes round to whole ones', () => {
    const b = (v: number) => formatNumber(v, 'en-US', { format: 'bytes' });
    expect([b(1048575), b(1023.9), b(1.5), b(1048575 * 1024), b(-1048575), b(1023)]).toEqual(['1 MB', '1 kB', '2 byte', '1 GB', '-1 MB', '1,023 byte']);
  });
});


describe('FormattedNumber: no negative zero (GR84)', () => {
  test('a negative value that rounds to zero is written as zero, in the component, formatNumber and the server; a real negative keeps its minus', async () => {
    const usd = { format: 'currency' as const, currency: 'USD' };
    expect([formatNumber(-0.004, 'en-US', usd), formatNumber(-0.004, 'de-DE', { format: 'currency', currency: 'EUR' }), formatNumber(-0.0001, 'en-US', { format: 'percent' }),
      formatNumber(-0, 'en-US'), formatNumber(-0.4, 'en-US', { maximumFractionDigits: 0 }), formatNumber(-0.4, 'en-US', { format: 'bytes' })])
      .toEqual(['$0.00', nf('de-DE', { style: 'currency', currency: 'EUR' }, 0), '0%', '0', '0', '0 byte']);
    expect([formatNumber(-0.006, 'en-US', usd), formatNumber(-1.5, 'en-US'), formatNumber(-1n, 'en-US')]).toEqual(['-$0.01', '-1.5', '-1']);
    // A signDisplay of your own is kept.
    expect(formatNumber(-0, 'en-US', { signDisplay: 'always' })).toBe(nf('en-US', { signDisplay: 'always' }, -0));
    await render(<FormattedNumber id="nz" value={-0.004} format="currency" currency="USD" locale="en-US" />);
    expect(el('nz').textContent).toBe('$0.00');
    expect(el('nz').value).toBe('-0.004');
    expect(renderToString(<FormattedNumber value={-0} locale="en-US" />)).toContain('>0</data>');
  });
});
