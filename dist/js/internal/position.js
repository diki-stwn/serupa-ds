// src/internal/position.ts
var OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
function parsePlacement(p, fallback) {
  const m = /^(top|bottom|left|right)(?:-(start|end))?$/.exec(p || "") || /^(top|bottom|left|right)(?:-(start|end))?$/.exec(fallback);
  return [m[1], m[2] || "center"];
}
function place(anchor, floating, placement, offset, fallback = "top", margin = 8) {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  const L = vv ? vv.offsetLeft : 0, T = vv ? vv.offsetTop : 0;
  const R = vv ? L + vv.width : document.documentElement.clientWidth, B = vv ? T + vv.height : document.documentElement.clientHeight;
  const parsed = parsePlacement(placement, fallback), align = parsed[1];
  let side = parsed[0];
  const rtl = getComputedStyle(document.documentElement).direction === "rtl";
  const space = (s) => s === "top" ? anchor.top - offset - margin - T : s === "bottom" ? B - margin - anchor.bottom - offset : s === "left" ? anchor.left - offset - margin - L : R - margin - anchor.right - offset;
  const need = (s) => s === "top" || s === "bottom" ? floating.height : floating.width;
  const other = OPPOSITE[side];
  if (space(side) < need(side) && (space(other) >= need(other) || space(other) > space(side))) side = other;
  let x, y, height = floating.height, maxHeight, maxWidth;
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
  const out = { x: Math.round(x), y: Math.round(y), side };
  if (maxHeight !== void 0) out.maxHeight = maxHeight;
  if (maxWidth !== void 0) out.maxWidth = maxWidth;
  return out;
}
var ownMaxWidth = /* @__PURE__ */ new WeakMap();
function placeLayer(layer, anchor, placement, offset, fallback) {
  const scroll = layer.scrollTop;
  if (!ownMaxWidth.has(layer)) ownMaxWidth.set(layer, layer.style.maxWidth);
  const own = ownMaxWidth.get(layer);
  layer.style.maxHeight = "";
  layer.style.overflowY = "";
  layer.style.maxWidth = own;
  const a = anchor.getBoundingClientRect();
  const r = place(a, { width: layer.offsetWidth, height: layer.offsetHeight }, placement, offset, fallback);
  layer.style.left = r.x + "px";
  layer.style.top = r.y + "px";
  layer.dataset.side = r.side;
  if (r.maxHeight !== void 0) {
    layer.style.maxHeight = r.maxHeight + "px";
    layer.style.overflowY = "auto";
  }
  if (r.maxWidth !== void 0) layer.style.maxWidth = own ? "min(" + own + ", " + r.maxWidth + "px)" : r.maxWidth + "px";
  layer.scrollTop = scroll;
  const w = layer.offsetWidth, h = layer.offsetHeight, clamp = (v, max) => Math.round(Math.min(Math.max(v, 0), max));
  const ox = r.side === "left" ? w : r.side === "right" ? 0 : clamp(a.left + a.width / 2 - r.x, w);
  const oy = r.side === "top" ? h : r.side === "bottom" ? 0 : clamp(a.top + a.height / 2 - r.y, h);
  layer.style.setProperty("--dk-layer-origin", ox + "px " + oy + "px");
}
function showLayer(el) {
  if (!el) return;
  if (typeof el.showPopover === "function" && el.hasAttribute("popover")) {
    try {
      if (!el.matches(":popover-open")) el.showPopover();
    } catch {
    }
  }
}
function hideLayer(el) {
  if (!el) return;
  if (typeof el.hidePopover === "function" && el.hasAttribute("popover")) {
    try {
      if (el.matches(":popover-open")) el.hidePopover();
    } catch {
    }
  }
}
function cssLength(el, prop) {
  const v = getComputedStyle(el).getPropertyValue(prop).trim(), n = parseFloat(v);
  if (isNaN(n)) return 0;
  if (/rem$/.test(v)) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  if (/em$/.test(v)) return n * (parseFloat(getComputedStyle(el).fontSize) || 16);
  return n;
}
export {
  cssLength,
  hideLayer,
  parsePlacement,
  place,
  placeLayer,
  showLayer
};
//# sourceMappingURL=position.js.map
