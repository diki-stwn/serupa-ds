// Places a floating element (a tooltip, popover or menu) next to its anchor, inside the viewport: it flips to
// the other side when there's no room, slides along the side to stay on screen, and when neither side has room it
// takes the roomier one and scrolls inside. Fixed coordinates, so it
// isn't clipped by scrolling or overflow: hidden ancestors (and in the top layer when shown as a popover).

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';
export type Placement = Side | `${Side}-${'start' | 'end'}`;

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Splits "bottom-start" into its side and alignment. Unknown values become the fallback. */
export function parsePlacement(p: string | undefined, fallback: Placement): [Side, Align] {
  const m = /^(top|bottom|left|right)(?:-(start|end))?$/.exec(p || "") || /^(top|bottom|left|right)(?:-(start|end))?$/.exec(fallback)!;
  return [m[1] as Side, (m[2] as Align) || "center"];
}

/** Where to put the floating element (left, top in viewport px), the side it ended up on, and a maxHeight when it's
    taller than the room it has: then it takes that height and scrolls inside, so all of it stays on screen. On the
    left or right, a maxWidth too when it's wider than the room beside the anchor (its text wraps instead). */
export function place(anchor: DOMRect, floating: { width: number; height: number }, placement: string | undefined, offset: number, fallback: Placement = "top", margin = 8): { x: number; y: number; side: Side; maxHeight?: number; maxWidth?: number } {
  // The part of the page on screen: the visual viewport where there is one, which a phone's on-screen keyboard
  // shrinks and pinch-zoom moves; anchor and result are in layout-viewport px, as getBoundingClientRect gives them.
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  const L = vv ? vv.offsetLeft : 0, T = vv ? vv.offsetTop : 0;
  const R = vv ? L + vv.width : document.documentElement.clientWidth, B = vv ? T + vv.height : document.documentElement.clientHeight;
  const parsed = parsePlacement(placement, fallback), align = parsed[1];
  let side = parsed[0];
  const rtl = getComputedStyle(document.documentElement).direction === "rtl";
  // The room on each side, between the anchor (and the gap) and the screen's margin.
  const space = (s: Side) => s === "top" ? anchor.top - offset - margin - T
    : s === "bottom" ? B - margin - anchor.bottom - offset
    : s === "left" ? anchor.left - offset - margin - L
    : R - margin - anchor.right - offset;
  const need = (s: Side) => s === "top" || s === "bottom" ? floating.height : floating.width;
  // Flip when only the other side fits; when neither does, take the side with more room.
  const other = OPPOSITE[side];
  if (space(side) < need(side) && (space(other) >= need(other) || space(other) > space(side))) side = other;
  let x: number, y: number, height = floating.height, maxHeight: number | undefined, maxWidth: number | undefined;
  if (side === "top" || side === "bottom") {
    if (height > space(side)) height = maxHeight = Math.max(0, Math.floor(space(side)));
    y = side === "top" ? anchor.top - offset - height : anchor.bottom + offset;
    const start = rtl ? anchor.right - floating.width : anchor.left, end = rtl ? anchor.left : anchor.right - floating.width;
    x = align === "start" ? start : align === "end" ? end : anchor.left + (anchor.width - floating.width) / 2;
    x = Math.min(Math.max(x, L + margin), Math.max(L + margin, R - margin - floating.width));
  } else {
    if (height > B - T - 2 * margin) height = maxHeight = Math.max(0, Math.floor(B - T - 2 * margin));
    let width = floating.width;
    if (width > space(side)) width = maxWidth = Math.max(0, Math.floor(space(side)));
    x = side === "left" ? anchor.left - offset - width : anchor.right + offset;
    x = Math.min(Math.max(x, L + margin), Math.max(L + margin, R - margin - width));
    y = align === "start" ? anchor.top : align === "end" ? anchor.bottom - height : anchor.top + (anchor.height - height) / 2;
    y = Math.min(Math.max(y, T + margin), Math.max(T + margin, B - margin - height));
  }
  const out: { x: number; y: number; side: Side; maxHeight?: number; maxWidth?: number } = { x: Math.round(x), y: Math.round(y), side };
  if (maxHeight !== undefined) out.maxHeight = maxHeight;
  if (maxWidth !== undefined) out.maxWidth = maxWidth;
  return out;
}

/** Places `layer` next to `anchor` with place(): its left, top and data-side, and a max-height with overflow-y: auto
    while it's taller than the room it has. It's measured at its own height each time, so it grows back when there's
    room again, and it keeps its scroll position. */
// The max-width the layer had before placeLayer first set one (a style prop's, or none), put back on each call.
const ownMaxWidth = new WeakMap<HTMLElement, string>();

export function placeLayer(layer: HTMLElement, anchor: Element, placement: string | undefined, offset: number, fallback?: Placement): void {
  const scroll = layer.scrollTop;
  if (!ownMaxWidth.has(layer)) ownMaxWidth.set(layer, layer.style.maxWidth);
  const own = ownMaxWidth.get(layer)!;
  layer.style.maxHeight = ""; layer.style.overflowY = ""; layer.style.maxWidth = own;
  const r = place(anchor.getBoundingClientRect(), { width: layer.offsetWidth, height: layer.offsetHeight }, placement, offset, fallback);
  layer.style.left = r.x + "px"; layer.style.top = r.y + "px"; layer.dataset.side = r.side;
  if (r.maxHeight !== undefined) { layer.style.maxHeight = r.maxHeight + "px"; layer.style.overflowY = "auto"; }
  if (r.maxWidth !== undefined) layer.style.maxWidth = own ? "min(" + own + ", " + r.maxWidth + "px)" : r.maxWidth + "px";
  layer.scrollTop = scroll;
}

/** Shows an element in the top layer when the browser supports popover="manual", so nothing can cover or clip it. */
export function showLayer(el: HTMLElement | null): void {
  if (!el) return;
  if (typeof el.showPopover === "function" && el.hasAttribute("popover")) { try { if (!el.matches(":popover-open")) el.showPopover(); } catch { /* not connected yet */ } }
}
export function hideLayer(el: HTMLElement | null): void {
  if (!el) return;
  if (typeof el.hidePopover === "function" && el.hasAttribute("popover")) { try { if (el.matches(":popover-open")) el.hidePopover(); } catch { /* already gone */ } }
}

/** A CSS length from a custom property ("0.375rem", "6px") in px. */
export function cssLength(el: Element, prop: string): number {
  const v = getComputedStyle(el).getPropertyValue(prop).trim(), n = parseFloat(v);
  if (isNaN(n)) return 0;
  if (/rem$/.test(v)) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  if (/em$/.test(v)) return n * (parseFloat(getComputedStyle(el).fontSize) || 16);
  return n;
}
