// src/internal/nameCheck.ts
import * as React from "react";
import { setRef } from "./cn.js";
import { warnOnce } from "./warn.js";
import { byId } from "./root.js";
function hasName(el, group = false) {
  const says = (n) => !!n && !!((n.getAttribute("aria-label") || "").trim() || (n.textContent || "").trim());
  const by = el.getAttribute("aria-labelledby");
  if (by && by.split(/\s+/).some((id) => says(byId(el, id)))) return true;
  if ((el.getAttribute("aria-label") || "").trim() || (el.getAttribute("title") || "").trim()) return true;
  const labels = el.labels;
  if (labels && Array.from(labels).some(says)) return true;
  const set = group ? el.closest("fieldset") : null;
  return !!set && says(set.querySelector(":scope > legend"));
}
function useNameCheck(component, how, ref) {
  const node = React.useRef(null);
  React.useEffect(function() {
    if (process.env.NODE_ENV !== "production" && node.current && !hasName(node.current, how === NAME_HOW.group)) warnOnce("no-name", `${component} has no accessible name, so a screen reader announces only its role. ${how}`, "name:" + component);
  }, [component, how]);
  return React.useCallback(function(n) {
    node.current = n;
    if (ref) setRef(ref, n);
  }, [ref]);
}
var NAME_HOW = {
  field: "Put it in a Field with a label, or give it a <label htmlFor>, aria-label or aria-labelledby.",
  group: "Put it in a Field group with a label, or give it aria-label or aria-labelledby.",
  label: "Give it a label, or an aria-label.",
  title: "Give it a title, or aria-label or aria-labelledby."
};
export {
  NAME_HOW,
  hasName,
  useNameCheck
};
//# sourceMappingURL=nameCheck.js.map
