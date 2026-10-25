import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { config } from "../../internal/config";
import { Icon } from "../Icon/Icon";
import { NewTabNote } from "./NewTabNote";
import { component } from "../../internal/component";
import { AutoFocusLink } from "./AutoFocusLink";
import * as icons from "../../material/builtin";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 'primary' (default): the primary color. 'neutral': the surrounding text's color, still underlined. */
  tone?: 'primary' | 'neutral';
  /** 'always' (default): underlined, so it's a link without relying on color. 'hover': only on hover and focus, for links whose place already says they're links (a nav bar, a footer). */
  underline?: 'always' | 'hover';
  /** Opens in a new tab (target="_blank", rel="noopener noreferrer"), with a new-tab icon and "(opens in a new tab)" for screen readers (the opensInNewTab label). Default: false. */
  external?: boolean;
  /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a' (it gets href, className and the rest). */
  as?: React.ElementType;
}

/* Link: an inline text link, underlined, in the primary color or the surrounding text's. external opens a new
   tab and says so. `as` renders your router's link instead of an <a>. className and every other prop go to it. */
/** An inline text link: underlined, primary or the text's color. external opens a new tab and says so. */
export const Link = /* @__PURE__ */ component<HTMLAnchorElement, LinkProps>("Link", function Link(props, ref) {
  const rest = omit(props, { tone: 1, underline: 1, external: 1, as: 1, className: 1, children: 1, autoFocus: 1 });
  const tone = oneOf(["primary", "neutral"] as const, props.tone, "primary");
  const underline = oneOf(["always", "hover"] as const, props.underline, "always");
  if (props.external) {
    if (rest.target == null) rest.target = "_blank";
    rest.rel = cn(rest.rel, "noopener noreferrer");
  }
  const attrs = Object.assign(rest, {
    "data-component": "link",
    className: cn("dk-link", tone === "neutral" && "dk-link--neutral", underline === "hover" && "dk-link--hover-underline", props.className),
  });
  const children = <>{props.children}{props.external ? <>
    <Icon icon={icons.OpenInNew} className="dk-link__icon" />
    <NewTabNote />
  </> : null}</>;
  // React only autofocuses form controls: with autoFocus, a small client component focuses the link once it's mounted.
  if (props.autoFocus) return <AutoFocusLink as={props.as || config.link} linkRef={ref} attrs={attrs}>{children}</AutoFocusLink>;
  return React.createElement(props.as || config.link, Object.assign(attrs, { ref: ref }), children);
});
