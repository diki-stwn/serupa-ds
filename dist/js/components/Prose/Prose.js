"use client";

// src/components/Prose/Prose.tsx
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
var TAGS = ["div", "article", "section"];
var MARK = "data-prose-scroll";
function syncScrollers(root) {
  const boxes = root.querySelectorAll("pre, table");
  for (let i = 0; i < boxes.length; i++) {
    const el = boxes[i], ours = el.hasAttribute(MARK);
    if (!ours && el.hasAttribute("tabindex")) continue;
    const wide = el.scrollWidth > el.clientWidth + 1;
    if (wide && !ours) {
      el.setAttribute("tabindex", "0");
      el.setAttribute(MARK, "");
    } else if (!wide && ours) {
      el.removeAttribute("tabindex");
      el.removeAttribute(MARK);
    }
  }
}
var Prose = /* @__PURE__ */ component("Prose", function Prose2(props, ref) {
  const rest = omit(props, { as: 1, className: 1 });
  const root = React.useRef(null);
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sync = () => syncScrollers(el);
    sync();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    const watch = () => {
      if (!ro) return;
      ro.disconnect();
      ro.observe(el);
      const b = el.querySelectorAll("pre, table");
      for (let i = 0; i < b.length; i++) ro.observe(b[i]);
    };
    watch();
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      watch();
      sync();
    });
    if (mo) mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
    };
  }, []);
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref: function(n) {
      root.current = n;
      setRef(ref, n);
    },
    "data-component": "prose",
    className: cn("dk-prose", props.className)
  }));
});
export {
  Prose
};
//# sourceMappingURL=Prose.js.map
