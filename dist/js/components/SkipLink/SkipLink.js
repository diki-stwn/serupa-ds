"use client";

// src/components/SkipLink/SkipLink.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { warnOnce } from "../../internal/warn.js";
import { en as words } from "./labels.js";
var FOCUSABLE = "a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";
var SkipLink = /* @__PURE__ */ component("SkipLink", function SkipLink2(props, ref) {
  const rest = omit(props, { target: 1, className: 1, children: 1, onClick: 1 });
  const labels = useSettings(words).labels;
  const target = props.target || "main";
  const onClick = props.onClick;
  const follow = React.useCallback(function(e) {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    const root = e.currentTarget.getRootNode();
    const to = (typeof root.getElementById === "function" ? root : document).getElementById(target);
    if (!to) {
      if (process.env.NODE_ENV !== "production") warnOnce("skip-link-target", 'SkipLink: no element with id "' + target + '" on the page. Give the main content that id (<main id="main">), or pass its id as target.');
      return;
    }
    e.preventDefault();
    if (!to.matches(FOCUSABLE)) {
      to.setAttribute("tabindex", "-1");
      to.addEventListener("blur", function() {
        to.removeAttribute("tabindex");
      }, { once: true });
    }
    to.focus();
    if (typeof history !== "undefined" && history.replaceState && location.hash !== "#" + target) history.replaceState(history.state, "", "#" + target);
  }, [onClick, target]);
  return /* @__PURE__ */ React.createElement("a", { ...rest, ref, href: "#" + target, onClick: follow, className: cn("dk-skip-link", props.className), "data-component": "skip-link" }, props.children != null ? props.children : labels.skipToContent);
});
export {
  SkipLink
};
//# sourceMappingURL=SkipLink.js.map
