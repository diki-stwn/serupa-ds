// src/internal/currency.ts
var DIGITS = /* @__PURE__ */ (() => {
  const t = {};
  for (const c of "BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF".split(" ")) t[c] = 0;
  for (const c of "BHD IQD JOD KWD LYD OMR TND".split(" ")) t[c] = 3;
  for (const c of "CLF UYW".split(" ")) t[c] = 4;
  return t;
})();
var minorDigits = (currency) => DIGITS[currency.toUpperCase()] ?? 2;
var SHOWN = /* @__PURE__ */ (() => {
  const t = {};
  for (const c of "AFN ALL COP HUF IDR IQD IRR KPW LAK LBP MGA MMK PKR SLL SOS SYP YER".split(" ")) t[c] = 0;
  return t;
})();
var shownDigits = (currency) => SHOWN[currency.toUpperCase()] ?? minorDigits(currency);
function pinCurrencyDigits(o) {
  const r = o;
  if (r.style !== "currency" || !r.currency || r.notation === "compact" || r.minimumFractionDigits !== void 0 || r.maximumFractionDigits !== void 0 || r.minimumSignificantDigits !== void 0 || r.maximumSignificantDigits !== void 0 || r.roundingIncrement !== void 0) return o;
  const d = shownDigits(r.currency);
  return { ...o, minimumFractionDigits: d, maximumFractionDigits: d };
}
export {
  minorDigits,
  pinCurrencyDigits,
  shownDigits
};
//# sourceMappingURL=currency.js.map
