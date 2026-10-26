// src/internal/affix.tsx
import * as React from "react";
var has = (n) => n != null && n !== false && n !== "";
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
  useAffixes
};
//# sourceMappingURL=affix.js.map
