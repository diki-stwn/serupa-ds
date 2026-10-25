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
