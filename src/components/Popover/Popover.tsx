"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { oneElement, useTriggerRef } from "../../internal/trigger";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import type { Placement } from "../../internal/position";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import type { OpenChangeDetails, OpenChangeReason } from "../../internal/openChange";

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

export interface PopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'role'> {
  /** The element that opens it: one element that can take focus, such as a Button. It gets aria-expanded and aria-controls. */
  trigger: React.ReactElement;
  /** What's inside: text, a form, links, buttons. A function gets close(), for a Cancel or Done button. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** A heading at the top that names the popover. */
  title?: React.ReactNode;
  /** The title's heading level, to fit the page's outline. Default: 2, as in Dialog. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Where it goes: 'bottom' (default), 'top', 'left', 'right', with '-start' or '-end'. It flips when there's no room. */
  placement?: Placement;
  /** Open it yourself (controlled), with onOpenChange. */
  open?: boolean;
  /** Open at first (uncontrolled). Default: false. */
  defaultOpen?: boolean;
  /** Called when it asks to open or close, with why: { reason: 'trigger' | 'escape' | 'outside' | 'blur' | 'close' }. */
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
  /** Its name for screen readers when it has no title. */
  "aria-label"?: string;
  /** Where focus goes when it opens: 'first' (default: the first control inside, or the panel) or 'panel'. */
  initialFocus?: 'first' | 'panel';
  /** Classes on the panel. The other HTML attributes (id, data-*, aria-*) and the ref go on the panel too. */
  className?: string;
  /** Styles on the panel. */
  style?: React.CSSProperties;
}

const OWN = { trigger: 1, children: 1, title: 1, "aria-label": 1, "aria-labelledby": 1, headingLevel: 1, placement: 1, open: 1, defaultOpen: 1, onOpenChange: 1, initialFocus: 1, className: 1, style: 1, onKeyDown: 1, onBlur: 1 } as const;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Popover: a small non-modal dialog next to its trigger, for content people interact with (a form, filters,
   details with links): role="dialog", named by its title. Opening moves focus inside; Escape closes it and
   returns focus to the trigger; a click outside, or focus moving elsewhere, closes it too. It sits in the top
   layer, right after the trigger in the tab order. For a hint, use Tooltip; for a list of actions, Menu. */
/** A small non-modal dialog next to its trigger, for interactive content: a form, filters, details. */
export const Popover = /* @__PURE__ */ component<HTMLDivElement, PopoverProps>("Popover", function Popover(props, ref) {
  const nameRef = useNameCheck("Popover", NAME_HOW.title);   // warns when it has no accessible name
  const own = domId("dk-pop", React.useId());
  const id = props.id || own;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const set = React.useCallback((v: boolean, reason: OpenChangeReason) => { if (!controlled) setInner(v); if (ask.current) ask.current(v, { reason }); }, [controlled]);
  const close = React.useCallback((reason: OpenChangeReason, focusTrigger: boolean) => { set(false, reason); if (focusTrigger && triggerRef.current) triggerRef.current.focus(); }, [set]);
  const focusFirst = props.initialFocus !== "panel";

  // Closing: the content stays (inert) while the panel fades out (DZ1); one open on arrival doesn't fade in.
  const exit = useExit(open, panelRef);
  useAnchoredLayer(open, panelRef, triggerRef, { placement: props.placement, offsetVar: "--dk-popover-offset", onOutside: () => close("outside", false), inside: triggerRef });
  // On open, focus moves inside (a press outside the panel and its trigger closes it; focus stays where the press put it).
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const first = focusFirst ? panel.querySelector<HTMLElement>(FOCUSABLE) : null;
    (first || panel).focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (e.defaultPrevented) return;
    if (e.key === "Escape" && !isComposing(e)) { e.preventDefault(); e.stopPropagation(); close("escape", true); }
  };
  // Focus leaving for somewhere other than the trigger closes it.
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (props.onBlur) props.onBlur(e);
    const to = e.relatedTarget as Node | null;
    if (!to) return;
    if (panelRef.current && panelRef.current.contains(to)) return;
    if (triggerRef.current && triggerRef.current.contains(to)) return;
    close("blur", false);
  };

  const child = oneElement<TriggerProps>(props.trigger, "Popover", "trigger");
  useTriggerRef(triggerRef, "Popover");
  const cp = child.props;
  const childRef = elementRef<HTMLElement>(child);
  const trigger = React.cloneElement(child, {
    ref: (n: HTMLElement | null) => { triggerRef.current = n; if (childRef) setRef(childRef, n); },
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: (e: React.MouseEvent<HTMLElement>) => { if (cp.onClick) cp.onClick(e); if (e.defaultPrevented) return; set(!open, "trigger"); },
  });
  const titled = props.title != null && props.title !== false && props.title !== "";
  const H = ("h" + ([2, 3, 4, 5, 6].indexOf(props.headingLevel as number) >= 0 ? props.headingLevel : 2)) as "h2";
  const content = typeof props.children === "function" ? (props.children as (c: () => void) => React.ReactNode)(() => close("close", true)) : props.children;
  return (
    <>
      {trigger}
      <div {...omit(props, OWN)} ref={(n) => { panelRef.current = n; setRef(ref, n); if (!titled) nameRef(n); }} id={id} role="dialog" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined}
        aria-labelledby={titled ? id + "-title" : props["aria-labelledby"]} aria-label={titled ? undefined : props["aria-label"]}
        className={cn("dk-popover", props.className)} style={props.style} data-component="popover" data-state={open ? "open" : "closed"} data-instant={exit.arrived ? "" : undefined}
        inert={!open || undefined} onKeyDown={onKeyDown} onBlur={onBlur}>
        {open || exit.leaving ? <>
          {titled ? <H id={id + "-title"} className="dk-popover__title">{props.title}</H> : null}
          <div className="dk-popover__body">{content}</div>
        </> : null}
      </div>
    </>
  );
});
