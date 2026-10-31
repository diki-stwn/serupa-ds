import * as React from 'react';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Table, TableBody, TableCell, TableRow } from '../components/Table/Table';

// The browser's locale (GR58): with no locale prop or provider, a component follows the browser's, which useLocale
// reads through useSyncExternalStore at least twice a render. Asking means building an Intl.DateTimeFormat, about
// 0.6ms on a slow phone, so it is asked once and kept until the browser fires languagechange. Before, a 1,000-row
// table took 2.4s to tick one row at 4x CPU slowdown.

/** Counts the DateTimeFormats built with no locale (the way the browser's locale is asked) while run() runs, and can
 *  make that default another locale, as a visitor's browser would. */
async function counting(run: () => unknown, browser?: string): Promise<number> {
  const Real = Intl.DateTimeFormat;
  let asked = 0;
  const Fake = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    if (locales === undefined) asked++;
    return new Real(locales ?? browser, options);
  } as unknown as typeof Intl.DateTimeFormat;
  Object.assign(Fake, { supportedLocalesOf: Real.supportedLocalesOf, prototype: Real.prototype });
  Intl.DateTimeFormat = Fake;
  try { await run(); return asked; } finally { Intl.DateTimeFormat = Real; }
}

function Rows({ n }: { n: number }) {
  const [ticked, setTicked] = React.useState(-1);
  return <Table caption="Calls"><TableBody>
    {Array.from({ length: n }, (_, i) => <TableRow key={i}>
      <TableCell><button type="button" id={`tick-${i}`} onClick={() => setTicked(i)}>{ticked === i ? 'Ticked' : 'Tick'}</button></TableCell>
      <TableCell align="end">{i * 7}</TableCell>
    </TableRow>)}
  </TableBody></Table>;
}

describe('the browser locale', () => {
  test('is asked once for a 1,000-row table, not again when a row re-renders', async () => {
    window.dispatchEvent(new Event('languagechange'));   // forget whatever an earlier test read
    const mount = await counting(() => render(<Rows n={1000} />));
    const tick = await counting(() => flushSync(() => document.getElementById('tick-500')!.click()));
    expect(document.getElementById('tick-500')!.textContent).toBe('Ticked');
    expect([mount, tick]).toEqual([1, 0]);
  });

  test('is asked again when the browser says its language changed, and the components follow it', async () => {
    await render(<Table caption="Calls"><TableBody><TableRow><TableCell id="n">{1204}</TableCell></TableRow></TableBody></Table>);
    // The real browser's digits, and another locale's: Arabic-Indic digits, or Latin ones where the browser is Arabic.
    const own = new Intl.NumberFormat(undefined, { useGrouping: false }).format(1204);
    const [other, theirs] = own === '1204' ? ['ar-EG', '١٢٠٤'] : ['en-US', '1204'];
    expect(document.getElementById('n')!.textContent).toBe(own);
    const asked = await counting(() => flushSync(() => window.dispatchEvent(new Event('languagechange'))), other);
    expect([asked, document.getElementById('n')!.textContent]).toEqual([1, theirs]);
    flushSync(() => window.dispatchEvent(new Event('languagechange')));   // back to the real browser's
    expect(document.getElementById('n')!.textContent).toBe(own);
  });
});
