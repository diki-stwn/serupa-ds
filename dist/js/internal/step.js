// src/internal/step.ts
function decimals(n) {
  if (!isFinite(n)) return 0;
  const [mantissa, exp] = String(n).split("e");
  const frac = (mantissa.split(".")[1] || "").length;
  return Math.max(0, frac - Number(exp || 0));
}
var gridPlaces = (min, step) => Math.max(decimals(step), min === void 0 ? 0 : decimals(min));
var roundTo = (v, places) => Number(v.toFixed(Math.min(20, places)));
function snap(v, min, max, step) {
  const n = roundTo(Math.round((v - min) / step) * step + min, gridPlaces(min, step));
  return Math.min(max, Math.max(min, n));
}
export {
  decimals,
  gridPlaces,
  roundTo,
  snap
};
//# sourceMappingURL=step.js.map
