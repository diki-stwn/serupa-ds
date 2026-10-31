import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { config } from "../../internal/config";
import { warnOnce } from "../../internal/warn";
import { Icon } from "../Icon/Icon";
import { NewTabNote } from "./NewTabNote";
import { component } from "../../internal/component";
import { AutoFocusLink } from "./AutoFocusLink";
import * as icons from "../../material/builtin";

/** Link's own props, beside those of the element it renders. */
export interface LinkOwnProps {
  /** 'primary' (default): the primary color. 'neutral': the surrounding text's color, still underlined. */
  tone?: 'primary' | 'neutral';
  /** 'always' (default): underlined, so it's a link without relying on color. 'hover': only on hover and focus, for links whose place already says they're links (a nav bar, a footer). */
  underline?: 'always' | 'hover';
  /** Opens in a new tab (target="_blank", rel="noopener noreferrer"), with a new-tab icon and "(opens in a new tab)" for screen readers (the opensInNewTab label). Default: false. */
  external?: boolean;
}

/** Link's props: its own, `as`, and the props of the element `as` names (an <a>'s by default), so
 *  <Link as={RouterLink} to="/settings"> takes RouterLink's `to`, and its ref is that element's. */
export type LinkProps<C extends React.ElementType = 'a'> = LinkOwnProps & {
  /** What renders the link: your router's link component. Default: the link set with configure({ link }), else 'a' (it gets href, className and the rest). */
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof LinkOwnProps | 'as'>;

/* Link: an inline text link, underlined, in the primary color or the surrounding text's. external opens a new
   tab and says so. `as` renders your router's link instead of an <a>. className and every other prop go to it. */
/** An inline text link: underlined, primary or the text's color. external opens a new tab and says so. */
const LinkBase = /* @__PURE__ */ component<HTMLAnchorElement, LinkProps>("Link", function Link(props, ref) {
  const rest = omit(props, { tone: 1, underline: 1, external: 1, as: 1, className: 1, children: 1, autoFocus: 1 });
  const tone = oneOf(["primary", "neutral"] as const, props.tone, "primary");
  const underline = oneOf(["always", "hover"] as const, props.underline, "always");
  // In the text's color with no underline at rest, nothing marks it as a link until it's hovered (WCAG 1.4.1).
  if (process.env.NODE_ENV !== "production" && tone === "neutral" && underline === "hover") warnOnce("link-neutral-hover", 'Link: tone="neutral" with underline="hover" looks like plain text until it is hovered. Keep the underline, or use tone="primary" in a place that already says it holds links.');
  if (props.external) {
    if (rest.target == null) rest.target = "_blank";
    rest.rel = cn(rest.rel, "noopener noreferrer");
  }
  const attrs = Object.assign(rest, {
    "data-component": "link",
    className: cn("dk-link", tone === "neutral" && "dk-link--neutral", underline === "hover" && "dk-link--hover-underline", props.className),
  });
  // The new-tab icon goes in a nowrap span with the last word of a text label, so it never starts a line alone (GF1).
  const icon = <Icon icon={icons.OpenInNew} className="dk-link__icon" />;
  const text = typeof props.children === "string" ? props.children : null;
  const cut = text != null ? text.search(/\S+\s*$/) : -1;
  // Your target _self, _parent or _top keeps it in this tab: no new-tab icon or "(opens in a new tab)" then (L8E63).
  const newTab = props.external && !/^_(self|parent|top)$/i.test(String(rest.target));
  const children = newTab ? <>
    {cut > 0 ? text!.slice(0, cut) : cut < 0 ? props.children : null}
    {cut >= 0 ? <span className="dk-link__last">{text!.slice(cut)}{icon}</span> : icon}
    <NewTabNote />
  </> : props.children;
  // React only autofocuses form controls: with autoFocus, a small client component focuses the link once it's mounted.
  if (props.autoFocus) return <AutoFocusLink as={props.as || config.link} linkRef={ref} attrs={attrs}>{children}</AutoFocusLink>;
  return React.createElement(props.as || config.link, Object.assign(attrs, { ref: ref }), children);
});

/** An inline text link: underlined, primary or the text's color. external opens a new tab and says so. `as` renders your router's link, typed with its props. */
export const Link = LinkBase as {
  <C extends React.ElementType = 'a'>(props: LinkProps<C> & { ref?: React.Ref<React.ComponentRef<C>> }): React.ReactElement | null;
  displayName?: string;
};
