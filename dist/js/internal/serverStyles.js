// src/internal/serverStyles.ts
import * as React from "react";
import { setRef } from "./cn.js";
var never = () => () => {
};
var yes = () => true;
var no = () => false;
function useServerStyles(ref) {
  const hydrating = !React.useSyncExternalStore(never, yes, no);
  const pending = React.useRef(hydrating);
  return React.useCallback(function(node) {
    if (node && pending.current) {
      pending.current = false;
      for (const el of [node, ...node.querySelectorAll("[style]")]) {
        if (!("style" in el)) continue;
        const text = el.getAttribute("style");
        if (text) {
          for (const d of text.split(/;(?![^(]*\))/)) {
            const at = d.indexOf(":");
            if (at > 0) el.style.setProperty(d.slice(0, at).trim(), d.slice(at + 1).trim());
          }
        } else fromProps(el);
      }
    }
    if (ref) setRef(ref, node);
  }, [ref]);
}
function fromProps(el) {
  const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
  const props = key ? Reflect.get(el, key) : void 0;
  for (const [k, v] of Object.entries(props?.style || {})) {
    if (v == null || typeof v === "boolean" || v === "") continue;
    if (k.startsWith("--")) el.style.setProperty(k, String(v));
    else if (Reflect.set(el.style, k, String(v)) && typeof v === "number" && v && !Reflect.get(el.style, k)) Reflect.set(el.style, k, v + "px");
  }
}
export {
  useServerStyles
};
//# sourceMappingURL=serverStyles.js.map
