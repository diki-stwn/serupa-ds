import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { component } from "../../internal/component";

export interface ProseProps extends React.HTMLAttributes<HTMLElement> {
  /** The element. Default: 'div'. 'article' for a post or a help page that stands on its own. */
  as?: 'div' | 'article' | 'section';
  /** The content: HTML from Markdown or a CMS (with dangerouslySetInnerHTML), or plain elements. */
  children?: React.ReactNode;
}

const TAGS = ["div", "article", "section"] as const;

/* Prose: a reading column for content nobody wrote in components: HTML from Markdown, a CMS or a rich-text editor.
   It spaces each block from the one before (more before a heading), brings back list markers, styles quotes, code,
   tables and images, and shows visited links in their own shade. className, ref and every other prop go to the element. */
/** Styles for Markdown and CMS content: spacing between blocks, headings, lists, quotes, code, tables and images. */
export const Prose = /* @__PURE__ */ component<HTMLElement, ProseProps>("Prose", function Prose(props, ref) {
  const rest = omit(props, { as: 1, className: 1 });
  return React.createElement(oneOf(TAGS, props.as, "div"), Object.assign(rest, {
    ref: ref, "data-component": "prose", className: cn("dk-prose", props.className),
  }));
});
