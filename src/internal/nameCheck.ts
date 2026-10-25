import * as React from "react";
import { setRef } from "./cn";
import { warnOnce } from "./warn";

/** Whether el has an accessible name from aria-labelledby, aria-label, a <label> (a Field's too) or title, or, for a
 *  group, the <legend> of the fieldset it's in (Field group). Text inside el doesn't count: none of the elements this
 *  checks take their name from what they hold. */
export function hasName(el: Element, group = false): boolean {
  const says = (n: Element | null) => !!n && !!((n.getAttribute("aria-label") || "").trim() || (n.textContent || "").trim());
  const by = el.getAttribute("aria-labelledby");
  if (by && by.split(/\s+/).some((id) => says(el.ownerDocument.getElementById(id)))) return true;
  if ((el.getAttribute("aria-label") || "").trim() || (el.getAttribute("title") || "").trim()) return true;
  const labels = (el as HTMLInputElement).labels;
  if (labels && Array.from(labels).some(says)) return true;
  const set = group ? el.closest("fieldset") : null;
  return !!set && says(set.querySelector(":scope > legend"));
}

/* A console warning, once per component, when the element the returned ref lands on has no accessible name after it
   mounts: a screen reader would announce only its role ("slider", "dialog"). how says how to name it. Checked after
   the commit, so a Field's label or a <label htmlFor> rendered after the element counts. The ref also fills ref. */
export function useNameCheck<T extends Element>(component: string, how: string, ref?: React.ForwardedRef<T>): (node: T | null) => void {
  const node = React.useRef<Element | null>(null);
  React.useEffect(function () {
    if (process.env.NODE_ENV !== "production" && node.current && !hasName(node.current, how === NAME_HOW.group)) warnOnce("name:" + component, `${component} has no accessible name, so a screen reader announces only its role. ${how}`);
  }, [component, how]);
  return React.useCallback(function (n: T | null) { node.current = n; if (ref) setRef(ref, n); }, [ref]);
}

/** How to name each kind of element, for useNameCheck's how. */
export const NAME_HOW = {
  field: "Put it in a Field with a label, or give it a <label htmlFor>, aria-label or aria-labelledby.",
  group: "Put it in a Field group with a label, or give it aria-label or aria-labelledby.",
  label: "Give it a label, or an aria-label.",
  title: "Give it a title, or aria-label or aria-labelledby.",
} as const;
