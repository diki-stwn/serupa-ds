// src/internal/focus.ts
import * as React from "react";
function delegateFocus(el, target) {
  if (el) el.focus = (options) => {
    const t = target();
    if (t) t.focus(options);
  };
}
function useAutoFocus(on, target) {
  const first = React.useRef({ on, target });
  first.current.target = target;
  React.useEffect(() => {
    if (first.current.on) first.current.target()?.focus();
  }, []);
}
export {
  delegateFocus,
  useAutoFocus
};
//# sourceMappingURL=focus.js.map
