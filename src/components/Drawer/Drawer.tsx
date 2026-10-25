"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { IconButton } from "../IconButton/IconButton";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import { modalClosed, modalOpened, modalOpening, wasDismissal } from "../../internal/layers";
import * as icons from "../../material/builtin";
import { useScrolls } from "../../internal/useScrolls";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";

export interface DrawerProps extends Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'title' | 'open'> {
  /** Whether it's open. Controlled: close it yourself in onOpenChange. */
  open?: boolean;
  /** Open at first, then it closes itself (uncontrolled), for one shown on arrival. Default: false. */
  defaultOpen?: boolean;
  /** Called with false when people ask to close it: Escape, the close button, or a click on the backdrop. */
  onOpenChange?: (open: boolean) => void;
  /** The edge it slides in from: 'right' (default), 'left', 'top' or 'bottom'. */
  side?: 'right' | 'left' | 'top' | 'bottom';
  /** The width of a left or right drawer: 'sm' 320px, 'md' 384px (default) or 'lg' 512px, at most the screen. Top and bottom drawers fit their content. */
  size?: 'sm' | 'md' | 'lg';
  /** The heading, which also names the drawer. */
  title?: React.ReactNode;
  /** A muted line under the title, read when it opens. */
  description?: React.ReactNode;
  /** Buttons pinned to the bottom, under a line: the main action last. */
  footer?: React.ReactNode;
  /** Shows the × in the corner. Default: true. */
  closeButton?: boolean;
  /** The × button's name. Default: 'Close'. */
  closeLabel?: string;
  /** Whether a click on the backdrop closes it. Default: true. */
  closeOnBackdrop?: boolean;
}

const OWN = { open: 1, defaultOpen: 1, onOpenChange: 1, side: 1, size: 1, title: 1, description: 1, footer: 1, closeButton: 1, closeLabel: 1, closeOnBackdrop: 1, className: 1, children: 1 } as const;

/* Drawer: a modal panel that slides in from an edge of the screen, for navigation on small screens, filters,
   or details and edits without leaving the page. It's a native <dialog> (showModal) like Dialog: focus stays
   inside, the page behind is inert and doesn't scroll, Escape, the × and the backdrop ask to close
   (onOpenChange(false)), and focus goes back where it was. */
/** A modal panel that slides in from an edge: navigation, filters, details. */
export const Drawer = /* @__PURE__ */ component<HTMLDialogElement, DrawerProps>("Drawer", function Drawer(props, ref) {
  const nameRef = useNameCheck("Drawer", NAME_HOW.title);   // warns when it has no accessible name
  const sds = useSerupa();
  const rest = omit(props, OWN);
  const base = domId("dk-drw", React.useId());
  const el = React.useRef<HTMLDialogElement | null>(null);
  const back = React.useRef<HTMLElement | null>(null);
  const side = oneOf(["right", "left", "top", "bottom"] as const, props.side, "right");
  const size = oneOf(["sm", "md", "lg"] as const, props.size, "md");
  const showClose = props.closeButton !== false;
  const backdrop = props.closeOnBackdrop !== false;
  const ask = React.useRef(props.onOpenChange); ask.current = props.onOpenChange;
  const [inner, setInner] = React.useState(!!props.defaultOpen);
  const controlled = props.open !== undefined;
  const open = controlled ? !!props.open : inner;
  const close = React.useCallback(() => { if (!controlled) setInner(false); if (ask.current) ask.current(false); }, [controlled]);
  const has = (n: React.ReactNode) => n != null && n !== false && n !== "";

  // Bumped when the browser closed it while open was true: open again, unless the parent said false.
  const [reopened, reopen] = React.useState(0);
  useIsoLayoutEffect(() => {
    const d = el.current;
    if (!d) return;
    if (open && !d.open) {
      if (!back.current) back.current = document.activeElement as HTMLElement | null;   // kept when it opens again
      modalOpening();
      if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
      modalOpened(d);
      // A child's autoFocus ran while the dialog was still hidden, and showModal() then focused the first focusable
      // (the ×). React doesn't write the autofocus attribute, so data-autofocus (or autofocus in plain HTML) marks it.
      const own = d.querySelector<HTMLElement>("[data-autofocus], [autofocus]");
      if (own && typeof own.focus === "function") own.focus();
    } else if (open) {
      // Already open: StrictMode ran the unmount cleanup (which took it off the modal stack) and mounts it again.
      modalOpened(d);
    } else {
      if (d.open) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
      modalClosed(d);
      const b = back.current; back.current = null;
      if (b && b.isConnected && typeof b.focus === "function") b.focus();
    }
  }, [open, reopened]);
  React.useEffect(() => { const d = el.current; return () => { if (d) modalClosed(d); const b = back.current; if (b && b.isConnected) b.focus(); }; }, []);

  // React passes a nested dialog's cancel and close up to this one, though the browser doesn't bubble them: only
  // this dialog's own count, or Escape in a Dialog or Drawer opened from inside it would close this one too.
  const onCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => { if (rest.onCancel) rest.onCancel(e); if (e.target !== e.currentTarget) return; e.preventDefault(); close(); };
  // The browser can close it on its own (dialog.close(), a form with method="dialog", an Escape it doesn't let us
  // cancel, such as Chromium's second Escape with no click in between): if open is still true, ask to close. A
  // parent that keeps open true gets it shown again, so open stays the truth.
  const openNow = React.useRef(open); openNow.current = open;
  const onClose = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (rest.onClose) rest.onClose(e);
    if (e.target !== e.currentTarget) return;
    if (!e.currentTarget.open) modalClosed(e.currentTarget);
    if (!openNow.current || e.currentTarget.open) return;
    close();
    reopen((n) => n + 1);
  };
  // A press that starts on the panel (selecting text, say) and ends on the backdrop clicks the <dialog> too: only a
  // press that starts and ends on the backdrop counts.
  const downOnBackdrop = React.useRef(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => { if (rest.onPointerDown) rest.onPointerDown(e); downOnBackdrop.current = e.target === e.currentTarget && !wasDismissal(e.nativeEvent); };
  const onClick = (e: React.MouseEvent<HTMLDialogElement>) => { if (rest.onClick) rest.onClick(e); if (backdrop && downOnBackdrop.current && e.target === e.currentTarget && !wasDismissal(e.nativeEvent)) close(); downOnBackdrop.current = false; };
  // A body taller than the panel takes Tab focus, so it can be scrolled from the keyboard when nothing in it is
  // focusable (only Chromium scrolls it with focus on the ×). It's a region named like the drawer, as Table's frame is.
  const [body, setBody] = React.useState<HTMLDivElement | null>(null);
  const scrolls = useScrolls(body);
  const named = rest["aria-labelledby"] || (has(props.title) ? base + "-title" : undefined);
  const region = !scrolls ? {} : named ? { tabIndex: 0, role: "region", "aria-labelledby": named }
    : rest["aria-label"] ? { tabIndex: 0, role: "region", "aria-label": rest["aria-label"] } : { tabIndex: 0 };
  return (
    <dialog {...rest} ref={(n) => { el.current = n; nameRef(n); setRef(ref, n); }}
      aria-modal="true"
      aria-labelledby={rest["aria-labelledby"] || (has(props.title) ? base + "-title" : undefined)}
      aria-describedby={rest["aria-describedby"] || (has(props.description) ? base + "-desc" : undefined)}
      className={cn("dk-drawer", "dk-drawer--" + side, "dk-drawer--" + size, props.className)} data-component="drawer" data-side={side} data-size={size}
      onCancel={onCancel} onClose={onClose} onPointerDown={onPointerDown} onClick={onClick}>
      <div className="dk-drawer__panel">
        {has(props.title) || has(props.description) || showClose ? (
          <div className="dk-drawer__header">
            <div className="dk-drawer__heading">
              {has(props.title) ? <h2 className="dk-drawer__title" id={base + "-title"}>{props.title}</h2> : null}
              {has(props.description) ? <p className="dk-drawer__description" id={base + "-desc"}>{props.description}</p> : null}
            </div>
            {showClose ? <IconButton className="dk-drawer__close" icon={icons.Close} label={props.closeLabel || sds.labels.close} size="sm" noTitle onClick={close} /> : null}
          </div>
        ) : null}
        {has(props.children) ? <div {...region} ref={setBody} className="dk-drawer__body">{props.children}</div> : null}
        {has(props.footer) ? <div className="dk-drawer__footer">{props.footer}</div> : null}
      </div>
    </dialog>
  );
});
