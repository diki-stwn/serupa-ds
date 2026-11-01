"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { Button } from "../Button/Button";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import * as icons from "../../material/builtin";
import type { IconData } from "../../material/types";
import { rootOf } from "../../internal/root";

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 'info' (default), 'success', 'warning', 'danger' or 'neutral'. Sets the background, the border tint and the icon. */
  tone?: AlertTone;
  /** A short bold first line. */
  title?: React.ReactNode;
  /** The icon before the content: an icon name or element, or false for none. Default: each tone's own (info, check_circle, warning, error). */
  icon?: IconSource | false;
  /** Buttons or links under the message. */
  actions?: React.ReactNode;
  /** Shows a close button that calls this. Hide or remove the alert yourself. */
  onDismiss?: () => void;
  /** The close button's name. Default: 'Dismiss'. */
  dismissLabel?: string;
}

/* Alert: a message about the page or a task, in a tinted box with an icon. tone info (default), success, warning,
   danger or neutral. role is "alert" for warning and danger (read at once when it appears) and "status" for the
   others; pass role to change it. className and every other prop go to the box. */
const OWN = { tone: 1, title: 1, icon: 1, actions: 1, onDismiss: 1, dismissLabel: 1, className: 1, children: 1 } as const;
const TONES: readonly AlertTone[] = ["info", "success", "warning", "danger", "neutral"];
const ICONS: Record<AlertTone, IconData> = { info: icons.Info, success: icons.CheckCircle, warning: icons.Warning, danger: icons.Error, neutral: icons.Info };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Dismissing with the focused × would drop focus on <body> once the app removes the alert (DQ1). It goes to the next
// focusable element after the alert instead, else the one before it, in the Tab order (not a roving tab that isn't
// the current one, tabindex -1: L8E23). A handler that moves focus, or keeps the alert, is left alone.
function dismissAndRefocus(e: React.MouseEvent<HTMLElement>, onDismiss: () => void): void {
  // Inside a shadow root, what has focus and what can take it are the root's, not the page's (GR60).
  const me = e.currentTarget, box = me.closest(".dk-alert"), doc = me.ownerDocument, r = rootOf(me);
  const near = box && r.activeElement === me ? Array.from(r.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && !box.contains(el)) : [];
  const next = near.filter((el) => box!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const prev = near.filter((el) => !next.includes(el)).reverse();
  onDismiss();
  if (near.length) setTimeout(function () {
    const a = r.activeElement;
    if (me.isConnected || (a && a !== doc.body)) return;
    // The first that takes focus: a control in a disabled <fieldset> matches but doesn't (L8E75), as in Popover (L8E22).
    next.concat(prev).some((el) => el.isConnected && el.getClientRects().length > 0 && (el.focus(), r.activeElement === el));
  }, 0);
}

/** A message about the page or a task: a tinted box with an icon, an optional title, actions and a close button. */
export const Alert = /* @__PURE__ */ component<HTMLDivElement, AlertProps>("Alert", function Alert(props, ref) {
  const sds = useSettings();
  const rest = omit(props, OWN);
  const tone = oneOf(TONES, props.tone, "info");
  const has = (n: React.ReactNode) => n != null && n !== false && n !== "";
  if (rest.role == null) rest.role = tone === "warning" || tone === "danger" ? "alert" : "status";
  const icon = props.icon === false ? null : props.icon == null || props.icon === true ? <Icon icon={ICONS[tone]} /> : asIcon(props.icon);
  return (
    <div {...rest} ref={ref} className={cn("dk-alert", "dk-alert--" + tone, props.className)} data-component="alert" data-tone={tone}>
      {icon ? <span className="dk-alert__icon" aria-hidden="true">{icon}</span> : null}
      <div className="dk-alert__content">
        {has(props.title) ? <p className="dk-alert__title">{props.title}</p> : null}
        {has(props.children) ? <div className="dk-alert__message">{props.children}</div> : null}
        {has(props.actions) ? <div className="dk-alert__actions">{props.actions}</div> : null}
      </div>
      {props.onDismiss ? <Button className="dk-alert__dismiss" variant="ghost" size="sm" icon={icons.Close} aria-label={props.dismissLabel || sds.labels.dismiss} onClick={(e) => dismissAndRefocus(e, props.onDismiss!)} /> : null}
    </div>
  );
});
