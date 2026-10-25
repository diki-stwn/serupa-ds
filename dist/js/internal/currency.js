// src/internal/currency.ts
var DIGITS = {};
for (const c of "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF".split(" ")) DIGITS[c] = 0;
for (const c of "BHD IQD JOD KWD LYD OMR TND".split(" ")) DIGITS[c] = 3;
for (const c of "CLF UYW".split(" ")) DIGITS[c] = 4;
var minorDigits = (currency) => DIGITS[currency.toUpperCase()] ?? 2;
export {
  minorDigits
};
//# sourceMappingURL=currency.js.map
