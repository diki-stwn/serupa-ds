// src/internal/ime.ts
function isComposing(e) {
  const n = e.nativeEvent || e;
  return !!n.isComposing || n.keyCode === 229;
}
export {
  isComposing
};
//# sourceMappingURL=ime.js.map
