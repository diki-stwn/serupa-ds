// src/internal/warn.ts
var warned = {};
var DOCS = "https://github.com/diki-stwn/serupa-ds/blob/main/docs/warnings.md#";
function warnOnce(code, msg, key = code) {
  if (!warned[key] && typeof console !== "undefined") {
    warned[key] = 1;
    console.warn(`${msg} (Serupa warning ${code}: ${DOCS}${code})`);
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
