"use client";
import * as React from "react";
import { cn, domId, elementRef, omit, setRef } from "../../internal/cn";
import { type Placement } from "../../internal/position";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer";
import { named } from "../../internal/component";
import { isComposing } from "../../internal/ime";

export interface TooltipProps {
  /** What the tooltip says: a short line of text. Keep links and buttons out (people can't reach them). */
  content: React.ReactNode;
  /** One element that can take focus (a Button, a link, an IconButton). The tooltip describes it. */
  children: React.ReactElement;
  /** 'top' (default), 'bottom', 'left', 'right', or with '-start' / '-end' ('bottom-start'). It flips when there's no room. */
  placement?: Placement;
  /** Milliseconds the pointer rests before it shows. Default: 400. Keyboard focus shows it at once. */
  delay?: number;
  /** 'description' (default): adds to the element's name (aria-describedby). 'label': is its name (aria-labelledby), for an icon-only button with no other label. */
  role?: 'description' | 'label';
  /** Open it yourself (controlled); with onOpenChange. */
  open?: boolean;
  /** Open at first (uncontrolled). Default: false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Never shows it, for example while the element is disabled. */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** The trigger element's props this component reads and adds to. */
type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;
type Handler = (e: React.SyntheticEvent<HTMLElement>) => void;

const OWN = { content: 1, children: 1, placement: 1, delay: 1, role: 1, open: 1, defaultOpen: 1, onOpenChange: 1, disabled: 1, className: 1, style: 1, ref: 1 } as const;

/* Tooltip: a short hint about an element, shown while it's hovered (after a delay) or focused, and placed next to
   it in the top layer. Escape hides it; the pointer can move onto the tooltip without it closing (WCAG 1.4.13).
   It describes the element (aria-describedby) or, with role="label", names it. */
/** A short hint about one element, shown on hover and keyboard focus. */
export const Tooltip = /* @__PURE__ */ named("Tooltip", function Tooltip(props: TooltipProps): React.ReactElement {
  const id = domId("dk-tip", React.useId());
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = !props.disabled && (controlled ? !!props.open : inner);
  const tipRef = React.useRef<HTMLDivElement | null>(null);
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const onOpenChange = React.useRef(props.onOpenChange); onOpenChange.current = props.onOpenChange;
  const set = React.useCallback((v: boolean) => { window.clearTimeout(timer.current); if (!controlled) setInner(v); if (onOpenChange.current) onOpenChange.current(v); }, [controlled]);
  const later = (v: boolean, ms: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => set(v), ms); };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  // Place it while open, and keep it placed as the page scrolls or resizes, or its text changes. A press outside hides it.
  useAnchoredLayer(open, tipRef, anchorRef, { placement: props.placement, fallback: "top", offsetVar: "--dk-tooltip-offset", watch: props.content, onOutside: () => set(false) });

  // Escape hides it from anywhere while it's open (the element may not have focus when hovered). It's the top
  // layer, so it takes that Escape: caught first (capture) and stopped, so a Dialog or Menu around it stays open.
  React.useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !isComposing(e)) { e.preventDefault(); e.stopPropagation(); set(false); } };
    document.addEventListener("keydown", esc, true);
    return () => document.removeEventListener("keydown", esc, true);
  }, [open, set]);

  const child = React.Children.only(props.children) as React.ReactElement<TriggerProps>;
  /* A Menu, Popover or other component that clones its trigger may be handed this Tooltip as the trigger: the
     props and ref it adds land here, so they go on to the element, with handlers chained after the element's own. */
  const passed = omit(props as TooltipProps & TriggerProps, OWN) as Record<string, unknown>;
  const fwd: Record<string, unknown> = {};
  for (const k in passed) {
    const own = (child.props as Record<string, unknown>)[k], add = passed[k];
    fwd[k] = typeof own === "function" && typeof add === "function" ? (e: React.SyntheticEvent<HTMLElement>) => { (own as Handler)(e); (add as Handler)(e); }
      : k === "id" && own ? own   // the element's own id stays: other things may point at it
      : (k === "aria-describedby" || k === "aria-labelledby") && typeof own === "string" && typeof add === "string" ? own + " " + add : add;
  }
  const cp: TriggerProps = { ...child.props, ...fwd };
  const passedRef = (props as { ref?: React.Ref<HTMLElement> }).ref;
  const delay = props.delay == null ? 400 : props.delay;
  const touch = (e: React.SyntheticEvent) => "pointerType" in e && e.pointerType === "touch";
  const chain = (name: keyof TriggerProps, fn: Handler): Handler => (e) => { const own: unknown = cp[name]; if (typeof own === "function") (own as Handler)(e); fn(e); };
  const childRef = elementRef<HTMLElement>(child);
  const aria = props.role === "label" ? "aria-labelledby" : "aria-describedby";
  const merged = [cp[aria], id].filter(Boolean).join(" ");
  const trigger = React.cloneElement(child, {
    ...fwd,
    ref: (n: HTMLElement | null) => { anchorRef.current = n; if (childRef) setRef(childRef, n); if (passedRef) setRef(passedRef, n); },
    [aria]: merged,
    // Pointer events, not mouse events: a tap sends a mouseenter after its pointerdown and never a mouseleave, so the
    // tooltip opened 400ms after a tap and stayed. A touch pointer doesn't hover; focus still shows it from the keyboard.
    onPointerEnter: chain("onPointerEnter", (e) => { if (!touch(e)) later(true, delay); }),
    onPointerLeave: chain("onPointerLeave", (e) => { if (!touch(e)) later(false, 100); }),
    onFocus: chain("onFocus", (e) => { const t = e.target as HTMLElement; if (!t.matches || t.matches(":focus-visible")) set(true); }),
    onBlur: chain("onBlur", () => set(false)),
    onPointerDown: chain("onPointerDown", () => set(false)),
  });
  return (
    <>
      {trigger}
      <div ref={tipRef} id={id} role="tooltip" {...{ popover: "manual" }} hidden={!open || undefined}
        className={cn("dk-tooltip", props.className)} style={props.style} data-component="tooltip" data-state={open ? "open" : "closed"}
        onMouseEnter={() => window.clearTimeout(timer.current)} onMouseLeave={() => later(false, 100)}>
        {props.content}
      </div>
    </>
  );
});
