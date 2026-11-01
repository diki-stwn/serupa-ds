// src/internal/root.ts
function rootOf(node) {
  const r = node && typeof node.getRootNode === "function" ? node.getRootNode() : null;
  return r && typeof r.getElementById === "function" ? r : document;
}
function activeIn(node) {
  return rootOf(node).activeElement;
}
export {
  activeIn,
  rootOf
};
//# sourceMappingURL=root.js.map
