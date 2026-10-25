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
        const text = el.getAttribute("style");
        if (text && "style" in el) el.style.cssText = text;
      }
    }
    if (ref) setRef(ref, node);
  }, [ref]);
}
export {
  useServerStyles
};
//# sourceMappingURL=serverStyles.js.map
