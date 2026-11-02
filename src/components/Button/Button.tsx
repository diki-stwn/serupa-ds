"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn, type DataAttributes, domId, omit, oneOf, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn";
import { config } from "../../internal/config";
import { useShowAfter } from "../../internal/showAfter";
import { useSettings } from "../../internal/provider";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { block, both, chain, pressKey, releaseKey } from "../../internal/interactions";
import { warnOnce } from "../../internal/warn";
import type { IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Loader } from "../Loader/Loader";
import { component } from "../../internal/component";
import { BUTTON_VARIANTS, buttonClass } from "./buttonClass";
import { feedbackHold, spinnerDelay } from "../../internal/timing";
// React 19's form status, read off the namespace: Preact's compat layer has no useFormStatus (and no form actions), so
// a named import would stop the whole package loading there. Without it a submit button is never pending on its own.
const noFormStatus = (): { pending: boolean } => ({ pending: false });
const useFormStatus: () => { pending: boolean } = (ReactDOM as Partial<typeof ReactDOM>).useFormStatus ?? noFormStatus;

export { buttonClass };

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** What every Button takes, as a <button> or as a link. */
interface ButtonOwnProps {
  /** Visual style. Default: 'primary' (solid brand color). */
  variant?: ButtonVariant;
  /** Danger colors on any variant, for deleting or irreversible actions. Default: false. */
  destructive?: boolean;
  /** Height: sm 24px, md 32px, lg 44px (the control-height tokens). Default: 'md'. */
  size?: ButtonSize;
  /** Icon before the label: an icon name (custom or Material Symbols, "add") or any element. */
  leftIcon?: IconSource;
  /** Icon after the label: an icon name (custom or Material Symbols, "arrow_forward") or any element. */
  rightIcon?: IconSource;
  /** Icon-only button: an icon name (custom or Material Symbols) or element, in a square at the size's height. Ignores children, leftIcon and rightIcon; needs an aria-label. */
  icon?: IconSource;
  /** Shows a centered Loader (ring) and blocks clicks, keys and Enter-key form submission while an action runs, so a request can't be sent twice. Keeps size, colors and keyboard focus; sets aria-busy, aria-disabled and data-loading. Default: false, except that a type="submit" button inside a `<form action={fn}>` is loading while that form is being sent. Set it to override. */
  loading?: boolean;
  /** Announced to screen readers (polite status region) when loading starts. Default: 'Loading'. Pass '' to stay silent. */
  loadingText?: string;
  /** Why it's disabled ("Fill in your name first"). With disabled, the button stays focusable (aria-disabled, so
      keyboard and screen reader users can reach it and hear why) and this is its description; clicks still do
      nothing. Wrap it in a Tooltip with the same words to show them on hover and focus too. */
  disabledReason?: string;
  /** Shown with a check in place of the label for 2 seconds, and announced, after an onClick that returned a
      promise resolves ("Saved"). For actions that don't move people elsewhere. Default: none. */
  successText?: string;
  /** Lets a long label take more than one line: the button grows from its size's height instead of cutting the
      label with an ellipsis. Without it, a text label that's cut shows in full as the button's title on hover.
      Default: false. */
  wrap?: boolean;
}

/** A Button without href: a native <button>. */
export interface ButtonAsButtonProps extends ButtonOwnProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'> {
  /** Without href it's a <button>; give it href to make it a link. */
  href?: undefined;
  /** Can return a promise: the button then takes no second click until it settles, shows loading if it takes a while, and shows successText once it resolves. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
  /** 'button' (default, never submits by accident), 'submit' or 'reset'. */
  type?: 'button' | 'submit' | 'reset';
  /** Opens, closes or toggles a [popover] element by id (native HTML). */
  popoverTarget?: string;
  /** What a press does to the popoverTarget element: 'show', 'hide' or 'toggle' (default). */
  popoverTargetAction?: 'show' | 'hide' | 'toggle';
  /** Invoker commands: the id of the element to act on, and the action ('show-modal', 'close', 'request-close', 'show-popover', 'hide-popover', 'toggle-popover', or a custom '--name'). */
  commandfor?: string;
  /** The action for the commandfor element: 'show-modal', 'close', 'request-close', 'show-popover', 'hide-popover', 'toggle-popover', or a custom '--name'. */
  command?: string;
}

/** A Button with href: a link (<a>, or the component set with Serupa.configure({ link })), for navigation. */
export interface ButtonAsLinkProps extends ButtonOwnProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type' | 'onClick'> {
  /** Can return a promise, as on a button. */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => unknown;
  /** Where the link goes. With target="_blank", rel defaults to "noopener noreferrer". */
  href: string;
  /** A link has no disabled state in HTML: a disabled link Button renders without href, with aria-disabled, and can't be focused or followed. */
  disabled?: boolean;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const OWN = { variant: 1, size: 1, destructive: 1, className: 1, children: 1, leftIcon: 1, rightIcon: 1, icon: 1, loading: 1, loadingText: 1, disabledReason: 1, successText: 1, wrap: 1 } as const;
const isThenable = (v: unknown): v is PromiseLike<unknown> => v != null && typeof (v as PromiseLike<unknown>).then === "function";


function slot(source: IconSource, side: string): React.ReactNode {
  const node = asIcon(source);
  return node == null || node === false ? null : <span className={"dk-btn__icon dk-btn__icon--" + side} aria-hidden key={side}>{node}</span>;
}

/* Button: a <button> for actions; with href, a link (<a>, or the configured link component) for navigation. */
/** Button without the overloads, for components built on it (IconButton, Fab) that pass either shape through. */
export const ButtonBase = /* @__PURE__ */ component<HTMLElement, ButtonProps>("Button", function Button(props, ref) {
  const sds = useSettings();
  // Both shapes (button and link) are HTML attributes; which ones apply depends on href below.
  const rest: React.AllHTMLAttributes<HTMLElement> & DataAttributes = omit(props as ButtonOwnProps & React.AllHTMLAttributes<HTMLElement>, OWN);
  const isLink = rest.href != null;
  const iconOnly = props.icon != null;
  const pos = props.leftIcon != null && props.rightIcon == null ? "left" : props.rightIcon != null && props.leftIcon == null ? "right" : undefined;
  const variant = oneOf(BUTTON_VARIANTS, props.variant, "primary");
  const size = oneOf(SIZES, props.size, "md");
  let classes = buttonClass({ variant: variant, size: size, destructive: props.destructive, iconOnly: iconOnly, iconPosition: pos, wrap: props.wrap, className: props.className });
  if (process.env.NODE_ENV !== "production" && iconOnly && !rest["aria-label"] && !rest["aria-labelledby"] && !rest.title) {
    warnOnce("button-icon-label", "Button: an icon-only button needs an aria-label.");
  }
  // An onClick that returns a promise: no second click until it settles (no double submits), loading once it has run
  // for spinnerDelay (a quick one, such as CopyButton's copy, doesn't flash or announce "Loading") and then for at least
  // spinnerMinShown, so one that ends just after spinnerDelay doesn't flash the spinner (EB1); then successText if it resolved.
  const [working, setWorking] = React.useState(false);
  const busy = useShowAfter(working, spinnerDelay);
  const [success, setSuccess] = React.useState(false);
  const pending = React.useRef(false);
  const won = React.useRef("");   // successText, once resolved: shown when the spinner has gone
  const alive = React.useRef(true);
  React.useEffect(function () { alive.current = true; return () => { alive.current = false; }; }, []);
  React.useEffect(function () {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), feedbackHold);
    return () => clearTimeout(t);
  }, [success]);
  React.useEffect(function () {
    if (working || busy || !won.current) return;
    const text = won.current;
    won.current = "";
    setSuccess(true);
    announce(text);
  }, [working, busy]);
  const successText = props.successText;
  const own = rest.onClick;
  if (own) rest.onClick = function (e: React.MouseEvent<HTMLElement>) {
    if (pending.current) { block(e); return; }
    const r: unknown = own(e);
    if (!isThenable(r)) return;
    pending.current = true;
    won.current = "";
    setSuccess(false);
    setWorking(true);
    const settle = function (ok: boolean) {
      pending.current = false;
      if (!alive.current) return;
      if (ok && successText) won.current = successText;
      setWorking(false);
    };
    // Rethrown, so a rejection Button watched still reaches window's unhandledrejection (Sentry, error reporting) once,
    // as it would without Button.
    r.then(function () { settle(true); }, function (err: unknown) { settle(false); throw err; });
  };
  // type="submit" in a <form action={fn}> that is being sent (React's form status): loading on its own, unless set.
  const form = useFormStatus();
  const loading = (props.loading != null ? !!props.loading : !isLink && rest.type === "submit" && form.pending) || busy;
  const disabled = !!rest.disabled;
  const reasonId = domId("dk-btn-why", React.useId());
  const reason = disabled && props.disabledReason ? props.disabledReason : "";
  const loadingText = props.loadingText == null ? sds.labels.loading : props.loadingText;
  React.useEffect(function () { ensureAnnouncer(); }, []);   // no cleanup: the region is shared
  const wasLoading = React.useRef(false);
  // Announced when loading starts, with the text it has then (a later loadingText change isn't announced again).
  const latestText = React.useRef(loadingText);
  React.useEffect(function () { latestText.current = loadingText; });   // every render: keeps the latest text
  React.useEffect(function () {
    if (loading && !wasLoading.current && latestText.current) announce(latestText.current);
    wasLoading.current = loading;
  }, [loading]);

  // Loading: the spinner sits in the center over the hidden content (label and icons), so the width stays the same.
  const spin = <Loader className="dk-btn__spinner" label="" delay={0} />;   // decorative: the button announces loadingText itself
  let content: React.ReactNode[] = iconOnly ? [slot(props.icon, "only")] : [
    slot(props.leftIcon, "left"),
    props.children == null || (props.children as unknown) === false ? null : <span className="dk-btn__label" key="label">{props.children}</span>,
    slot(props.rightIcon, "right")
  ];
  if (loading) content = content.concat([<span className="dk-btn__loader" aria-hidden key="loader">{spin}</span>]);
  else if (success) content = content.concat([<span className="dk-btn__loader dk-btn__success" aria-hidden key="success"><span className="dk-btn__check" /></span>]);
  // The reason: a hidden element can still be a description (aria-describedby), and isn't part of the name.
  // A description passed in (a Tooltip around it, with the same words) is used instead, so it isn't read twice.
  if (reason && !rest["aria-describedby"]) {
    content.push(<span hidden id={reasonId} key="reason">{reason}</span>);
    rest["aria-describedby"] = reasonId;
  }

  // A text label cut with an ellipsis shows in full as the button's title on hover (the same words as its name, so
  // nothing is read twice). Not with wrap, an icon-only button, or a name, title or Tooltip of its own. A Tooltip here would
  // add 2.6 KiB to every Button; wrap is the answer for keyboard and touch.
  const text = typeof props.children === "string" || typeof props.children === "number" ? String(props.children) : "";
  const tipOk = !!text && !iconOnly && !props.wrap && rest.title == null && !rest["aria-label"] && !rest["aria-labelledby"] && !rest["aria-describedby"];
  const node = React.useRef<HTMLElement | null>(null);
  const [cut, setCut] = React.useState(false);
  useIsoLayoutEffect(function () {
    const label = node.current && node.current.querySelector<HTMLElement>(".dk-btn__label");
    if (!tipOk || !label) { setCut(false); return; }
    const check = () => setCut(label.scrollWidth > label.clientWidth);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(label);
    return () => ro.disconnect();
  }, [tipOk, text]);
  if (cut && tipOk) rest.title = text;
  const setNode = React.useCallback(function (n: HTMLElement | null) { node.current = n; setRef(ref, n); }, [ref]);

  // Micro-interactions: Enter shows the press like Space (your handlers run first)
  rest.onKeyDown = chain(rest.onKeyDown, pressKey);
  rest.onKeyUp = both(rest.onKeyUp, releaseKey);
  rest.onBlur = both(rest.onBlur, releaseKey);

  // Hooks for tests, analytics and styling
  rest["data-component"] = "button";
  rest["data-variant"] = variant;
  rest["data-size"] = size;
  if (props.destructive) rest["data-destructive"] = "";
  if (iconOnly) rest["data-icon-only"] = "";
  if (disabled) rest["data-disabled"] = "";
  if (success && !loading) { classes = cn(classes, "dk-btn--loading-cover", "dk-btn--success"); rest["data-success"] = ""; }
  if (reason) {
    // Disabled, but focusable: aria-disabled instead of the disabled attribute, and clicks blocked.
    delete rest.disabled;
    rest["aria-disabled"] = true;
    rest.onClick = block;
  }
  if (loading) {
    classes = cn(classes, "dk-btn--loading", "dk-btn--loading-cover");
    rest["aria-busy"] = true;
    rest["aria-disabled"] = true;   // stays focusable (focus isn't lost mid-request), but announced as unavailable
    rest["data-loading"] = "";
    rest.onClick = block;           // clicks, Space, Enter and Enter-key form submission do nothing
  }

  if (isLink) {
    // A link opening a new tab can't reach back into this page (rel="noopener"); pass rel to choose otherwise.
    if (rest.target === "_blank" && rest.rel == null) rest.rel = "noopener noreferrer";
    if (disabled) {
      if (reason) rest.tabIndex = rest.tabIndex ?? 0;   // stays reachable, to hear why
      // Links have no disabled state: drop href so it's no longer a link, can't be focused or followed,
      // and isn't listed among the page's links; role="link" + aria-disabled keep what it is.
      delete rest.href; delete rest.disabled;
      rest.role = "link";
      rest["aria-disabled"] = true;
      rest.onClick = block;          // and its handler doesn't run (screen readers and scripts can still click it)
    }
    delete rest.type;
    return React.createElement(disabled ? "a" : config.link, Object.assign({}, rest, { ref: setNode, className: classes }), ...content);
  }
  if (rest.type === undefined) rest.type = "button";   // never submits a form by accident; pass type="submit" to submit
  return React.createElement("button", Object.assign({}, rest, { ref: setNode, className: classes }), ...content);
});

/** A <button> for actions; pass href for navigation and it renders a link. Built-in micro-interactions: press and a loading cross-fade, plus an opt-in right-icon nudge (--button-icon-nudge); off under reduced motion. Colors, spacing, sizes, borders and motion can be overridden with the --button-* component tokens (button.tokens.json) on the page, a container or one button. */
export const Button = ButtonBase as unknown as {
  (props: ButtonAsButtonProps & React.RefAttributes<HTMLButtonElement>): React.ReactElement | null;
  (props: ButtonAsLinkProps & React.RefAttributes<HTMLAnchorElement>): React.ReactElement | null;
  displayName?: string;
};
