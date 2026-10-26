// src/internal/currency.ts
var DIGITS = /* @__PURE__ */ (() => {
  const t = {};
  for (const c of "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF".split(" ")) t[c] = 0;
  for (const c of "BHD IQD JOD KWD LYD OMR TND".split(" ")) t[c] = 3;
  for (const c of "CLF UYW".split(" ")) t[c] = 4;
  return t;
})();
var minorDigits = (currency) => DIGITS[currency.toUpperCase()] ?? 2;
export {
  minorDigits
};
//# sourceMappingURL=currency.js.map
