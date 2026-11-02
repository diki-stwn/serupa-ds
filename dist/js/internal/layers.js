// src/internal/layers.ts
import { pageShared } from "./pageShared.js";
var page = /* @__PURE__ */ pageShared("layers@1", () => ({ modals: [], listeners: /* @__PURE__ */ new Set() }));
var topModal = () => page.modals[page.modals.length - 1] || null;
function onModalChange(fn) {
  page.listeners.add(fn);
  return () => {
    page.listeners.delete(fn);
  };
}
function modalOpening() {
  if (page.modals.length || typeof document === "undefined") return;
  const root = document.documentElement;
  if (window.innerWidth - root.clientWidth > 0) root.setAttribute("data-dk-gutter", "");
  else root.removeAttribute("data-dk-gutter");
}
function modalOpened(el) {
  const at = page.modals.indexOf(el);
  if (at >= 0) page.modals.splice(at, 1);
  page.modals.push(el);
  page.listeners.forEach((l) => l());
}
function modalClosed(el) {
  const at = page.modals.indexOf(el);
  if (at < 0) return;
  page.modals.splice(at, 1);
  page.listeners.forEach((l) => l());
}
var dismissals = /* @__PURE__ */ new WeakSet();
function markDismissal(e) {
  dismissals.add(e);
}
var wasDismissal = (e) => dismissals.has(e);
export {
  markDismissal,
  modalClosed,
  modalOpened,
  modalOpening,
  onModalChange,
  topModal,
  wasDismissal
};
//# sourceMappingURL=layers.js.map
