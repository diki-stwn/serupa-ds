"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { warnOnce } from "../../internal/warn";
import { en as words } from "./labels";

export interface SkipLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The id of the element it skips to: the page's main content. Default: "main". */
  target?: string;
  /** The link's text. Default: "Skip to content" (labels.skipToContent). */
  children?: React.ReactNode;
}

const FOCUSABLE = "a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";

/* SkipLink: the first thing in the page, hidden until Tab reaches it, then shown at the top. Following it moves focus
   to the target (main by default), even when that isn't focusable (it gets tabindex="-1" for as long as it has
   focus), so the next Tab goes on from there in every browser. The page scrolls it into view below a sticky Navbar,
   whose scroll-padding keeps it clear of the bar (WCAG 2.4.11). A real link, so it works before the script loads.
   className, ref and every other prop go to the <a>. */
/** A "Skip to content" link, shown on keyboard focus, that moves focus to the page's main content. */
export const SkipLink = /* @__PURE__ */ component<HTMLAnchorElement, SkipLinkProps>("SkipLink", function SkipLink(props, ref) {
  const rest = omit(props, { target: 1, className: 1, children: 1, onClick: 1 });
  const labels = useSettings(words).labels;
  const target = props.target || "main";
  const onClick = props.onClick;
  const follow = React.useCallback(function (e: React.MouseEvent<HTMLAnchorElement>) {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    const root = e.currentTarget.getRootNode() as Document | ShadowRoot;   // in a shadow root, its own ids
    const to = (typeof root.getElementById === "function" ? root : document).getElementById(target);
    if (!to) {
      if (process.env.NODE_ENV !== "production") warnOnce("skip-link-target", "SkipLink: no element with id \"" + target + "\" on the page. Give the main content that id (<main id=\"main\">), or pass its id as target.");
      return;
    }
    e.preventDefault();
    if (!to.matches(FOCUSABLE)) {
      to.setAttribute("tabindex", "-1");
      to.addEventListener("blur", function () { to.removeAttribute("tabindex"); }, { once: true });
    }
    to.focus();
    if (typeof history !== "undefined" && history.replaceState && location.hash !== "#" + target) history.replaceState(history.state, "", "#" + target);
  }, [onClick, target]);
  return <a {...rest} ref={ref} href={"#" + target} onClick={follow} className={cn("dk-skip-link", props.className)} data-component="skip-link">
    {props.children != null ? props.children : labels.skipToContent}
  </a>;
});
