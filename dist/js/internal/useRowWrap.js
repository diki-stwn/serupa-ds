// src/internal/useRowWrap.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
function useRowWrap(root, fits, children) {
  const [wrapped, setWrapped] = React.useState(false);
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || !fits || typeof ResizeObserver === "undefined") {
      setWrapped(false);
      return;
    }
    const measure = () => {
      const kids = [...el.children];
      if (el.classList.contains("dk-button-group--attached")) {
        if (el.scrollWidth > el.clientWidth + 1) setWrapped(true);
      } else if (kids.reduce((w, k) => w + k.offsetWidth, 0) <= el.clientWidth) setWrapped(false);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const k of el.children) ro.observe(k);
    measure();
    return () => ro.disconnect();
  }, [fits, children]);
  return wrapped;
}
export {
  useRowWrap
};
//# sourceMappingURL=useRowWrap.js.map
