// src/internal/root.ts
function rootOf(node) {
  const r = node && typeof node.getRootNode === "function" ? node.getRootNode() : null;
  return r && typeof r.getElementById === "function" ? r : document;
}
function activeIn(node) {
  return rootOf(node).activeElement;
}
function deepActive() {
  let a = typeof document === "undefined" ? null : document.activeElement;
  while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
  return a;
}
function byId(node, id) {
  return rootOf(node).getElementById(id);
}
export {
  activeIn,
  byId,
  deepActive,
  rootOf
};
//# sourceMappingURL=root.js.map
