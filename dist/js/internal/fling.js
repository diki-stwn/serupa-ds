// src/internal/fling.ts
var WINDOW = 100;
var SLOPE = 3;
function track(s, t, p) {
  s.push({ t, p });
  while (s.length > 2 && s[0].t < t - WINDOW) s.shift();
}
function speed(s) {
  const a = s[0], b = s[s.length - 1];
  return a && b ? (b.p - a.p) / Math.max(1, b.t - a.t) : 0;
}
function settleTime(distance, v, { min = 150, max = 400, floor = 1 } = {}) {
  return Math.round(Math.min(max, Math.max(min, SLOPE * Math.abs(distance) / Math.max(Math.abs(v), floor))));
}
var project = (v, rate = 0.99) => v * rate / (1 - rate);
var rubber = (d, w) => Math.sign(d) * (1 - 1 / (Math.abs(d) * 0.55 / Math.max(1, w) + 1)) * w;
export {
  project,
  rubber,
  settleTime,
  speed,
  track
};
//# sourceMappingURL=fling.js.map
