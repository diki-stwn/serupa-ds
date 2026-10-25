// src/internal/warn.ts
var warned = {};
function warnOnce(key, msg) {
  if (!warned[key] && typeof console !== "undefined") {
    warned[key] = 1;
    console.warn(msg);
  }
}
function resetWarnings() {
  for (const k of Object.keys(warned)) delete warned[k];
}
export {
  resetWarnings,
  warnOnce
};
//# sourceMappingURL=warn.js.map
