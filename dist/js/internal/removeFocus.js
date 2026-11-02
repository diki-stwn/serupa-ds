// src/internal/removeFocus.ts
import { activeIn } from "./root.js";
function removeAndRefocus(e, onRemove, item, remove) {
  const me = e.currentTarget, own = me.closest(item);
  let scope = own && own.parentElement;
  if (scope && scope.childElementCount === 1 && scope.parentElement) scope = scope.parentElement;
  const all = scope ? Array.from(scope.querySelectorAll(remove)) : [];
  const at = all.indexOf(me);
  onRemove(e);
  setTimeout(function() {
    const active = activeIn(scope || me);
    if (me.isConnected || active && active !== me.ownerDocument.body) return;
    const next = all.slice(at + 1).concat(all.slice(0, at).reverse()).find((b) => b.isConnected && !b.disabled && b.getClientRects().length > 0);
    if (next) next.focus();
  }, 0);
}
export {
  removeAndRefocus
};
//# sourceMappingURL=removeFocus.js.map
