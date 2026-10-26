"use client";
import * as React from "react";
import { cn, domId, oneOf, omit } from "../../internal/cn";
import { config } from "../../internal/config";
import { component } from "../../internal/component";

export type CardVariant = 'outline' | 'elevated' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** 'outline' (default): surface, a border and a hairline shadow. 'elevated': a raised shadow, for content that floats over the page. 'filled': surface-muted and flat, for panels inside another surface. */
  variant?: CardVariant;
  /** Inner padding: 'none' (for full-bleed media; pad the parts yourself), 'sm' 12px, 'md' 20px (default) or 'lg' 24px. */
  padding?: CardPadding;
  /** The element: 'div' (default), 'section', 'article' or 'li'. */
  as?: 'div' | 'section' | 'article' | 'li';
  /** Makes the whole card clickable, with a hover border and a focus ring. The link (the component set with
      configure({ link }), <a> by default) goes around the CardHeader's title and is named by it; its area is
      stretched over the card. Buttons and links inside still work on their own. Without a CardHeader title, the
      link is named by the card's text. */
  href?: string;
  /** The link's target. "_blank" adds rel="noopener noreferrer". */
  target?: string;
  /** The link's rel. */
  rel?: string;
}

/* Card: a surface that groups related content and actions, made of CardHeader, CardBody and CardFooter (or any
   content). variant "outline" (default), "elevated" or "filled"; padding "none", "sm", "md" (default) or "lg".
   With href the whole card is clickable through one link: around a direct CardHeader child's title, or, without
   one, an empty link over the card named by the card's text (the "stretched link" pattern, so buttons inside
   aren't nested in a link). className, ref and every other prop go to the card element; href, target, rel and
   aria-label go to the link. */
const INTERACTIVE = "a[href], button, input, select, textarea, label, summary, [tabindex]";
const OWN = { variant: 1, padding: 1, as: 1, className: 1, href: 1, target: 1, rel: 1, children: 1 } as const;

type CardLinkProps = { href: string; target?: string; rel?: string; "aria-label"?: string };
// The link a linked card hands its CardHeader for the title; null outside one.
const CardLinkContext = /* @__PURE__ */ React.createContext<CardLinkProps | null>(null);
const VARIANTS: readonly CardVariant[] = ["outline", "elevated", "filled"];
const PADDINGS: readonly CardPadding[] = ["none", "sm", "md", "lg"];
const TAGS = ["div", "section", "article", "li"] as const;

/** A surface that groups related content and actions: CardHeader, CardBody and CardFooter inside. With href, the whole card is a link. */
export const Card = /* @__PURE__ */ component<HTMLElement, CardProps>("Card", function Card(props, ref) {
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "outline");
  const padding = oneOf(PADDINGS, props.padding, "md");
  const base = domId("dk-card", React.useId());
  const isLink = props.href != null;
  const cls = cn("dk-card", variant !== "outline" && "dk-card--" + variant, padding !== "md" && "dk-card--padding-" + padding, isLink && "dk-card--link", props.className);
  const tag = oneOf(TAGS, props.as, "div");
  if (!isLink) return React.createElement(tag, Object.assign(rest, { ref: ref, className: cls, "data-component": "card", "data-variant": variant }), props.children);
  const link: CardLinkProps = { href: props.href!, target: props.target, rel: props.target === "_blank" && props.rel == null ? "noopener noreferrer" : props.rel, "aria-label": rest["aria-label"] };
  delete rest["aria-label"];
  // A direct CardHeader with a title takes the link; otherwise the card gets an empty one, named by its own text.
  const titled = React.Children.toArray(props.children).some((c) => React.isValidElement(c) && c.type === CardHeader && hasContent((c.props as CardHeaderProps).title));
  const id = rest.id || base;
  const own = rest.onClick;
  const ownAux = rest.onAuxClick;
  // The text (CardBody, the header's description) sits above the link's area so it can be selected and copied. A
  // click on it still follows the link, unless it ended a selection. The card's own link, or null when the click
  // was on something interactive inside, or ended a selection.
  const target = (e: React.MouseEvent<HTMLElement>) => {
    const t = e.target as Element;
    if (e.defaultPrevented || !(t instanceof Element) || t.closest(INTERACTIVE)) return null;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && e.currentTarget.contains(sel.anchorNode)) return null;
    return e.currentTarget.querySelector<HTMLAnchorElement>(".dk-card__link");
  };
  // A browser treats a click it didn't make as a plain one, so a Ctrl, Cmd or Shift click, or a middle click, would
  // navigate this tab away instead of opening another: open the other tab here (ER1).
  const away = (a: HTMLAnchorElement) => window.open(a.href, "_blank", "noopener");
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (own) own(e);
    const a = target(e);
    if (!a) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) away(a);
    else a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, altKey: e.altKey }));
  };
  const onAuxClick = (e: React.MouseEvent<HTMLElement>) => {
    if (ownAux) ownAux(e);
    const a = e.button === 1 ? target(e) : null;
    if (a) away(a);
  };
  return React.createElement(tag, Object.assign(rest, { id: id, ref: ref, className: cls, "data-component": "card", "data-variant": variant, onClick: onClick, onAuxClick: onAuxClick }),
    titled ? null : React.createElement(config.link, { ...link, className: "dk-card__link dk-card__link--cover", "aria-labelledby": link["aria-label"] ? undefined : id, key: "link" }),
    <CardLinkContext.Provider value={titled ? link : null} key="content">{props.children}</CardLinkContext.Provider>);
});

const hasContent = (n: React.ReactNode) => n != null && n !== false && n !== "";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The card's title, as a heading. */
  title?: React.ReactNode;
  /** A muted line (or a few) under the title. */
  description?: React.ReactNode;
  /** Something at the end of the header: a Badge, a menu button. */
  action?: React.ReactNode;
  /** The title's heading level: 2 to 6, default 3. Pick the level that fits the page's outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** The card's title, an optional description and an optional action at the end. Any children come after the description. */
export const CardHeader = /* @__PURE__ */ component<HTMLDivElement, CardHeaderProps>("CardHeader", function CardHeader(props, ref) {
  const rest = omit(props, { title: 1, description: 1, action: 1, headingLevel: 1, className: 1, children: 1 });
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel as number) < 0 ? 3 : (props.headingLevel as number);
  const has = hasContent;
  const link = React.useContext(CardLinkContext);
  return (
    <div {...rest} ref={ref} className={cn("dk-card__header", props.className)}>
      <div className="dk-card__heading">
        {has(props.title) ? React.createElement("h" + level, { className: "dk-card__title" }, link ? React.createElement(config.link, { ...link, className: "dk-card__link" }, props.title) : props.title) : null}
        {has(props.description) ? <p className="dk-card__description">{props.description}</p> : null}
        {props.children}
      </div>
      {has(props.action) ? <div className="dk-card__action">{props.action}</div> : null}
    </div>
  );
});

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

/** The card's main content. */
export const CardBody = /* @__PURE__ */ component<HTMLDivElement, CardBodyProps>("CardBody", function CardBody(props, ref) {
  return <div {...props} ref={ref} className={cn("dk-card__body", props.className)} />;
});

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Where the actions sit: 'end' (default), 'start' or 'between' (the first at the start, the rest at the end: give them a wrapper). */
  justify?: 'start' | 'end' | 'between';
}

/** The card's actions, in a wrapping row at the end. */
export const CardFooter = /* @__PURE__ */ component<HTMLDivElement, CardFooterProps>("CardFooter", function CardFooter(props, ref) {
  const rest = omit(props, { justify: 1, className: 1 });
  const j = oneOf(["start", "end", "between"] as const, props.justify, "end");
  return <div {...rest} ref={ref} className={cn("dk-card__footer", j !== "end" && "dk-card__footer--" + j, props.className)} />;
});
