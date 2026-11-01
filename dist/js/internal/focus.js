// src/internal/focus.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
function delegateFocus(el, target) {
  if (el) el.focus = (options) => {
    const t = target();
    if (t) t.focus(options);
  };
}
function windowBlur(e) {
  return e.currentTarget.ownerDocument.activeElement === e.currentTarget;
}
function useAutoFocus(on, target) {
  const first = React.useRef({ on, target });
  first.current.target = target;
  React.useEffect(() => {
    if (first.current.on) first.current.target()?.focus();
  }, []);
}
function useFocusHandover() {
  const pending = React.useRef(null);
  useIsoLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    const a = document.activeElement;
    const lost = a === p.from ? !p.from.isConnected || p.from.matches(':disabled, [aria-disabled="true"]') : !a || a === document.body;
    const t = lost ? p.to() : null;
    if (t && t !== p.from) t.focus();
  });
  return React.useCallback((from, to) => {
    if (document.activeElement === from) pending.current = { from, to };
  }, []);
}
export {
  delegateFocus,
  useAutoFocus,
  useFocusHandover,
  windowBlur
};
//# sourceMappingURL=focus.js.map
