// A currency's minor units from ISO 4217: 2 for most (USD, EUR, IDR), 0 for JPY and KRW, 3 for KWD, 4 for CLF.
// From the standard rather than Intl, whose display digits differ between engines (IDR shows 0 in Chrome and 2 in
// Node), so an amount stored in minor units is the same number on the server and in every browser.
// Built by a function marked pure, so a bundler leaves the table out of a project that never reads it.
const DIGITS: Record<string, number> = /* @__PURE__ */ (() => {
  const t: Record<string, number> = {};
  for (const c of "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF".split(" ")) t[c] = 0;
  for (const c of "BHD IQD JOD KWD LYD OMR TND".split(" ")) t[c] = 3;
  for (const c of "CLF UYW".split(" ")) t[c] = 4;
  return t;
})();

/** How many minor units a currency has, as a power of ten: minorDigits("USD") is 2 (cents), "JPY" 0. */
export const minorDigits = (currency: string): number => DIGITS[currency.toUpperCase()] ?? 2;

// The decimals a currency shows in, where CLDR's differ from its minor units: IDR is 2 in ISO 4217 and 0 in CLDR 48.
// Engines ship different CLDR (Node and Chromium write "Rp 150.000", Safari and Firefox "Rp 150.000,00"), so a server
// render in one and a hydration in another wouldn't match. From the CLDR of the Node the package is built with;
// tools/test/currency.mjs fails when that Node's CLDR says otherwise.
const SHOWN: Record<string, number> = /* @__PURE__ */ (() => {
  const t: Record<string, number> = {};
  for (const c of "AFN ALL COP HUF IDR IQD IRR KPW LAK LBP MGA MMK PKR SLL SOS SYP YER".split(" ")) t[c] = 0;
  return t;
})();

/** How many decimals a currency is shown with: shownDigits("IDR") is 0, "USD" 2, "KWD" 3, the same in every engine. */
export const shownDigits = (currency: string): number => SHOWN[currency.toUpperCase()] ?? minorDigits(currency);

/** Currency options with the decimals pinned to shownDigits, unless they already set how to round (fraction or
 *  significant digits, an increment) or are compact, so a number is written the same in every engine. */
export function pinCurrencyDigits<T extends Intl.NumberFormatOptions>(o: T): T {
  const r = o as Intl.NumberFormatOptions & { roundingIncrement?: number };
  if (r.style !== "currency" || !r.currency || r.notation === "compact" || r.minimumFractionDigits !== undefined || r.maximumFractionDigits !== undefined
    || r.minimumSignificantDigits !== undefined || r.maximumSignificantDigits !== undefined || r.roundingIncrement !== undefined) return o;
  const d = shownDigits(r.currency);
  return { ...o, minimumFractionDigits: d, maximumFractionDigits: d };
}
