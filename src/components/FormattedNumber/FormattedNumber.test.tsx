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
