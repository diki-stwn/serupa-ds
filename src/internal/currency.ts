// A currency's minor units from ISO 4217: 2 for most (USD, EUR, IDR), 0 for JPY and KRW, 3 for KWD, 4 for CLF.
// From the standard rather than Intl, whose display digits differ between engines (IDR shows 0 in Chrome and 2 in
// Node), so an amount stored in minor units is the same number on the server and in every browser.
// module state: a fixed table, filled once below.
const DIGITS: Record<string, number> = {};
for (const c of "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF".split(" ")) DIGITS[c] = 0;
for (const c of "BHD IQD JOD KWD LYD OMR TND".split(" ")) DIGITS[c] = 3;
for (const c of "CLF UYW".split(" ")) DIGITS[c] = 4;

/** How many minor units a currency has, as a power of ten: minorDigits("USD") is 2 (cents), "JPY" 0. */
export const minorDigits = (currency: string): number => DIGITS[currency.toUpperCase()] ?? 2;
