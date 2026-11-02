// src/internal/affix.tsx
import * as React from "react";
import { activeIn } from "./root.js";
var has = (n) => n != null && n !== false && n !== "";
function pressFocuses(field) {
  return (e) => {
    const f = field.current, t = e.target;
    if (e.button !== 0 || !f || f.disabled || t === f || t.closest("button, a, input, select, textarea, [tabindex], [popover]")) return;
    e.preventDefault();
    if (activeIn(f) === f) return;
    f.focus();
    try {
      f.setSelectionRange(f.value.length, f.value.length);
    } catch {
    }
  };
}
function useAffixes(prefix, suffix, base, field) {
  const ids = [has(prefix) ? base + "-prefix" : "", has(suffix) ? base + "-suffix" : ""].filter(Boolean).join(" ");
  const focus = (e) => {
    e.preventDefault();
    if (field.current && !field.current.disabled) field.current.focus();
  };
  const part = (node, side) => has(node) ? /* @__PURE__ */ React.createElement("span", { className: "dk-input__affix dk-input__affix--" + side, id: base + "-" + side, key: side, onMouseDown: focus }, node) : null;
  return { ids, prefix: part(prefix, "prefix"), suffix: part(suffix, "suffix") };
}
export {
  pressFocuses,
  useAffixes
};
//# sourceMappingURL=affix.js.map
