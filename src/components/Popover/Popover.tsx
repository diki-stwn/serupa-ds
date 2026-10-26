"use client";
import * as React from "react";
import { cn, domId, elementRef, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { oneElement, useTriggerRef } from "../../internal/trigger";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import type { Placement } from "../../internal/position";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { named } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import type { OpenChangeDetails, OpenChangeReason } from "../../internal/openChange";

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

export interface PopoverProps {
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
  className?: string;
  style?: React.CSSProperties;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Popover: a small non-modal dialog next to its trigger, for content people interact with (a form, filters,
   details with links): role="dialog", named by its title. Opening moves focus inside; Escape closes it and
   returns focus to the trigger; a click outside, or focus moving elsewhere, closes it too. It sits in the top
   layer, right after the trigger in the tab order. For a hint, use Tooltip; for a list of actions, Menu. */
/** A small non-modal dialog next to its trigger, for interactive content: a form, filters, details. */
export const Popover = /* @__PURE__ */ named("Popover", function Popover(props: PopoverProps): React.ReactElement {
  const nameRef = useNameCheck("Popover", NAME_HOW.title);   // warns when it has no accessible name
  const id = domId("dk-pop", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const set = React.useCallback((v: boolean, reason: OpenChangeReason) => { if (!controlled) setInner(v); if (ask.current) ask.current(v, { reason }); }, [controlled]);
  const close = React.useCallback((reason: OpenChangeReason, focusTrigger: boolean) => { set(false, reason); if (focusTrigger && triggerRef.current) triggerRef.current.focus(); }, [set]);
  const focusFirst = props.initialFocus !== "panel";

  // Closing: the content stays (inert) while the panel fades out, so it doesn't fade an empty box; once its
  // transitions end, or at once where none run, it goes. Open on arrival: there from the first frame, no fade.
  const [leaving, setLeaving] = React.useState(false), [was, setWas] = React.useState(open);
  if (was !== open) { setWas(open); setLeaving(!open); }
  const arrived = React.useRef(open); if (!open) arrived.current = false;
  useAnchoredLayer(open, panelRef, triggerRef, { placement: props.placement, offsetVar: "--dk-popover-offset", onOutside: () => close("outside", false), inside: triggerRef });
  useIsoLayoutEffect(() => {
    const p = panelRef.current;
    if (!leaving || !p) return;
    const runs = typeof p.getAnimations === "function" ? p.getAnimations() : [];
    if (!runs.length) { setLeaving(false); return; }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => { if (on) setLeaving(false); });
    return () => { on = false; };
  }, [leaving]);
  // On open, focus moves inside (a press outside the panel and its trigger closes it; focus stays where the press put it).
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const first = focusFirst ? panel.querySelector<HTMLElement>(FOCUSABLE) : null;
    (first || panel).focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !isComposing(e)) { e.preventDefault(); e.stopPropagation(); close("escape", true); }
  };
  // Focus leaving for somewhere other than the trigger closes it.
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
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
      <div ref={(n) => { panelRef.current = n; if (!titled) nameRef(n); }} id={id} role="dialog" tabIndex={-1} {...{ popover: "manual" }} hidden={!open || undefined}
        aria-labelledby={titled ? id + "-title" : undefined} aria-label={titled ? undefined : props["aria-label"]}
        className={cn("dk-popover", props.className)} style={props.style} data-component="popover" data-state={open ? "open" : "closed"} data-instant={arrived.current ? "" : undefined}
        inert={!open || undefined} onKeyDown={onKeyDown} onBlur={onBlur}>
        {open || leaving ? <>
          {titled ? <H id={id + "-title"} className="dk-popover__title">{props.title}</H> : null}
          <div className="dk-popover__body">{content}</div>
        </> : null}
      </div>
    </>
  );
});
