// src/internal/space.ts
var SPACE = ["0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16", "20", "24"];
function space(step) {
  const s = typeof step === "number" || typeof step === "string" ? String(step) : "";
  return SPACE.indexOf(s) < 0 ? void 0 : "var(--spacing-" + s.replace(/[\\.]/g, "\\$&") + ")";
}
export {
  SPACE,
  space
};
//# sourceMappingURL=space.js.map
