import * as React from "react";
import { useIsoLayoutEffect } from "./cn";

/** For an attached ButtonGroup row (ButtonGroup, ToggleGroup): true while the row is wider than its container (six
 *  buttons at 320px), so it can drop the attached class and wrap as separate buttons rather than scroll the page
 *  sideways (WCAG 1.4.10); false again once there's room for the row. `fits` is false when it can't wrap (not
 *  attached, or vertical). */
export function useRowWrap(root: React.RefObject<HTMLElement | null>, fits: boolean, children: React.ReactNode): boolean {
  const [wrapped, setWrapped] = React.useState(false);
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || !fits || typeof ResizeObserver === "undefined") { setWrapped(false); return; }
    const measure = () => {
      const kids = [...el.children] as HTMLElement[];
      // Attached, it's capped at its container's width, so a row that doesn't fit overflows. Wrapped, it's as wide as
      // its container, and the row fits once the buttons side by side are no wider.
      if (el.classList.contains("dk-button-group--attached")) { if (el.scrollWidth > el.clientWidth + 1) setWrapped(true); }
      else if (kids.reduce((w, k) => w + k.offsetWidth, 0) <= el.clientWidth) setWrapped(false);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const k of el.children) ro.observe(k);
    measure();
    return () => ro.disconnect();
  }, [fits, children]);
  return wrapped;
}
