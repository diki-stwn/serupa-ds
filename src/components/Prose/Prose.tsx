"use client";
import * as React from "react";
import { cn, oneOf, omit, setRef } from "../../internal/cn";
import { component } from "../../internal/component";

export interface ProseProps extends React.HTMLAttributes<HTMLElement> {
  /** The element. Default: 'div'. 'article' for a post or a help page that stands on its own. */
  as?: 'div' | 'article' | 'section';
  /** The content: HTML from Markdown or a CMS (with dangerouslySetInnerHTML), or plain elements. */
  children?: React.ReactNode;
}

const TAGS = ["div", "article", "section"] as const;
const MARK = "data-prose-scroll";

/* A code block or table wider than the column scrolls in its own box, and a box that scrolls must take focus, or the
   keyboard can't reach what's past its edge (WCAG 2.1.1, axe scrollable-region-focusable). The HTML comes from Markdown
   or a CMS, so the author can't add tabindex: each one that overflows gets tabindex 0, taken away again once it fits.
   One the content gave a tabindex of its own is left alone. */
function syncScrollers(root: HTMLElement) {
  const boxes = root.querySelectorAll<HTMLElement>("pre, table");
  for (let i = 0; i < boxes.length; i++) {
    const el = boxes[i], ours = el.hasAttribute(MARK);
    if (!ours && el.hasAttribute("tabindex")) continue;
    const wide = el.scrollWidth > el.clientWidth + 1;
    if (wide && !ours) { el.setAttribute("tabindex", "0"); el.setAttribute(MARK, ""); }
    else if (!wide && ours) { el.removeAttribute("tabindex"); el.removeAttribute(MARK); }
  }
}

/* Prose: a reading column for content nobody wrote in components: HTML from Markdown, a CMS or a rich-text editor.
   It spaces each block from the one before (more before a heading), brings back list markers, styles quotes, code,
   tables and images, and shows visited links in their own shade. className, ref and every other prop go to the element. */
/** Styles for Markdown and CMS content: spacing between blocks, headings, lists, quotes, code, tables and images. */
export const Prose = /* @__PURE__ */ component<HTMLElement, ProseProps>("Prose", function Prose(props, ref) {
  const rest = omit(props, { as: 1, className: 1 });
  const root = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sync = () => syncScrollers(el);
    sync();
    // Wider or narrower column, or new content (an editor preview re-rendering its HTML): check again.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    const watch = () => { if (!ro) return; ro.disconnect(); ro.observe(el); const b = el.querySelectorAll("pre, table"); for (let i = 0; i < b.length; i++) ro.observe(b[i]); };
    watch();
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => { watch(); sync(); });
    if (mo) mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { if (ro) ro.disconnect(); if (mo) mo.disconnect(); };
  }, []);
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref: function (n: HTMLElement | null) { root.current = n; setRef(ref, n); }, "data-component": "prose", className: cn("dk-prose", props.className),
  }));
});
