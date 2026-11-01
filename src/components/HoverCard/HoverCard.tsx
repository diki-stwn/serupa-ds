"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef } from "../../internal/cn";
import { oneElement, useTriggerRef } from "../../internal/trigger";
import type { Placement } from "../../internal/position";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { useExit } from "../../internal/useExit";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import type { OpenChangeDetails, OpenChangeReason } from "../../internal/openChange";
import { cardIntent, cardLeave } from "../../internal/timing";

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;
type Handler = (e: React.SyntheticEvent<HTMLElement>) => void;

export interface HoverCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
  /** The element it previews: one element that can take focus, usually a link to the page with the full details. */
  trigger: React.ReactElement;
  /** What the card shows: a person's name, photo and role, a page's title and summary. Links and buttons are fine. */
  children: React.ReactNode;
  /** Where it goes: 'bottom' (default), 'top', 'left', 'right', with '-start' or '-end'. It flips when there's no room. */
  placement?: Placement;
  /** Milliseconds the pointer rests on the trigger, or keyboard focus stays on it, before the card opens. Default: 500. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves the trigger and the card (or focus leaves both) before it closes. Default: 300. */
  closeDelay?: number;
  /** Open it yourself (controlled), with onOpenChange. */
  open?: boolean;
  /** Open at first (uncontrolled). Default: false. */
  defaultOpen?: boolean;
  /** Called when it asks to open or close, with why: { reason: 'hover' | 'focus' | 'blur' | 'escape' | 'outside' }. */
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
  /** Never opens, for example while the trigger is disabled. */
  disabled?: boolean;
  /** Classes on the card. The other HTML attributes (id, data-*, aria-*) and the ref go on the card too. */
  className?: string;
  /** Styles on the card. */
  style?: React.CSSProperties;
}

const OWN = { trigger: 1, children: 1, placement: 1, openDelay: 1, closeDelay: 1, open: 1, defaultOpen: 1, onOpenChange: 1, disabled: 1, className: 1, style: 1, onBlur: 1, onFocus: 1, onPointerEnter: 1, onPointerLeave: 1 } as const;

/* HoverCard: a preview of what a link points to (a person, a page, a repository), shown while the pointer rests on
   the link or keyboard focus stays on it, and placed next to it in the top layer. Unlike a Tooltip it may hold links
   and buttons: the pointer can move onto it, and it comes right after the trigger in the Tab order, so Tab goes from
   the trigger into it. It stays open while the pointer or focus is on either, and closes a moment after both leave.
   Escape closes it (and brings focus back to the trigger from inside). A touch screen has no hover, so it never
   opens there: the link itself goes to the details, so nothing may live only in the card. */
/** A preview card for a link, shown on hover and keyboard focus, that may hold links of its own. */
export const HoverCard = /* @__PURE__ */ component<HTMLDivElement, HoverCardProps>("HoverCard", function HoverCard(props, ref) {
  const own = domId("dk-hcard", React.useId());
  const id = props.id || own;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = !props.disabled && (controlled ? !!props.open : inner);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const openRef = React.useRef(open); openRef.current = open;
  const set = React.useCallback((v: boolean, reason: OpenChangeReason) => {
    window.clearTimeout(timer.current);
    if (v === openRef.current) return;
    if (!controlled) setInner(v);
    if (ask.current) ask.current(v, { reason });
  }, [controlled]);
  // Escape during the open delay cancels the open, and the card stays shut until the pointer or focus leaves the
  // trigger and comes back (GR88): it was dismissed before it showed. Nothing is on screen yet, so that Escape
  // goes on to whatever else handles it.
  const muted = React.useRef(false);
  const armed = React.useRef<((e: KeyboardEvent) => void) | null>(null);
  const unarm = () => { if (armed.current) document.removeEventListener("keydown", armed.current, true); armed.current = null; };
  const later = (v: boolean, ms: number, reason: OpenChangeReason) => {
    window.clearTimeout(timer.current); unarm();
    if (v && muted.current) return;
    timer.current = window.setTimeout(() => { unarm(); set(v, reason); }, ms);
    if (!v || openRef.current) return;
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape" || isComposing(e)) return; window.clearTimeout(timer.current); unarm(); muted.current = true; };
    armed.current = esc;
    document.addEventListener("keydown", esc, true);
  };
  const unmute = () => { muted.current = false; };
  const stay = () => window.clearTimeout(timer.current);
  React.useEffect(() => () => { window.clearTimeout(timer.current); unarm(); }, []);
  const openDelay = props.openDelay == null ? cardIntent : props.openDelay;
  const closeDelay = props.closeDelay == null ? cardLeave : props.closeDelay;

  // Closing: the content stays (inert) while the card fades out; one open on arrival doesn't fade in.
  const exit = useExit(open, cardRef);
  useAnchoredLayer(open, cardRef, triggerRef, { placement: props.placement, offsetVar: "--dk-hover-card-offset", watch: props.children, onOutside: () => set(false, "outside"), inside: triggerRef });

  // Escape closes it from anywhere while it's open (the trigger may only be hovered). It's the top layer, so it
  // takes that Escape: caught first and stopped, so a Dialog around it stays open. From inside, focus goes back.
  React.useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isComposing(e)) return;
      e.preventDefault(); e.stopPropagation();
      const card = cardRef.current, back = !!card && card.contains(e.target as Node);
      set(false, "escape");
      if (back && triggerRef.current) triggerRef.current.focus();
    };
    document.addEventListener("keydown", esc, true);
    return () => document.removeEventListener("keydown", esc, true);
  }, [open, set]);

  // Focus moving somewhere other than the trigger or the card closes it, after the same grace as the pointer.
  const within = (to: EventTarget | null) => !!to && ((!!cardRef.current && cardRef.current.contains(to as Node)) || (!!triggerRef.current && triggerRef.current.contains(to as Node)));
  const blurred = (e: React.SyntheticEvent) => { if (!within((e as React.FocusEvent).relatedTarget)) { unmute(); later(false, closeDelay, "blur"); } };
  const touch = (e: React.SyntheticEvent) => "pointerType" in e && (e as React.PointerEvent).pointerType === "touch";

  const child = oneElement<TriggerProps>(props.trigger, "HoverCard", "trigger");
  useTriggerRef(triggerRef, "HoverCard");
  const cp = child.props;
  const childRef = elementRef<HTMLElement>(child);
  const chain = (name: keyof TriggerProps, fn: Handler): Handler => (e) => { const f: unknown = cp[name]; if (typeof f === "function") (f as Handler)(e); fn(e); };
  const trigger = React.cloneElement(child, {
    ref: (n: HTMLElement | null) => { triggerRef.current = n; if (childRef) setRef(childRef, n); },
    // Pointer events, not mouse events: a tap sends a mouseenter and never a mouseleave. A touch pointer doesn't hover.
    onPointerEnter: chain("onPointerEnter", (e) => { if (touch(e)) return; if (openRef.current) stay(); else later(true, openDelay, "hover"); }),
    onPointerLeave: chain("onPointerLeave", (e) => { if (!touch(e)) { unmute(); later(false, closeDelay, "hover"); } }),
    // Keyboard focus only (focus-visible): a click on the link is on its way to the page it opens.
    onFocus: chain("onFocus", (e) => { const t = e.target as HTMLElement; if (openRef.current) stay(); else if (!t.matches || t.matches(":focus-visible")) later(true, openDelay, "focus"); }),
    onBlur: chain("onBlur", blurred),
  });
  return (
    <>
      {trigger}
      <div {...omit(props, OWN)} ref={(n) => { cardRef.current = n; setRef(ref, n); }} id={id} {...{ popover: "manual" }} hidden={!open || undefined}
        className={cn("dk-hover-card", props.className)} style={props.style} data-component="hover-card" data-state={open ? "open" : "closed"} data-instant={exit.instant ? "" : undefined}
        inert={!open || undefined}
        onPointerEnter={(e) => { if (props.onPointerEnter) props.onPointerEnter(e); stay(); }}
        onPointerLeave={(e) => { if (props.onPointerLeave) props.onPointerLeave(e); if (!touch(e)) later(false, closeDelay, "hover"); }}
        onFocus={(e) => { if (props.onFocus) props.onFocus(e); stay(); }}
        onBlur={(e) => { if (props.onBlur) props.onBlur(e); blurred(e); }}>
        {open || exit.leaving ? props.children : null}
      </div>
    </>
  );
});
