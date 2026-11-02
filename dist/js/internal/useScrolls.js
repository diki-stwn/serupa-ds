// src/internal/useScrolls.ts
import * as React from "react";
function useScrolls(el) {
  const [scrolls, setScrolls] = React.useState(false);
  React.useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(check);
    const watch = () => {
      ro.disconnect();
      ro.observe(el);
      for (const c of Array.from(el.children)) ro.observe(c);
      check();
    };
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(watch);
    if (mo) mo.observe(el, { childList: true });
    watch();
    return () => {
      ro.disconnect();
      if (mo) mo.disconnect();
    };
  }, [el]);
  return scrolls && !!el && typeof ResizeObserver !== "undefined";
}
export {
  useScrolls
};
//# sourceMappingURL=useScrolls.js.map
