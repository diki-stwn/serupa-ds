// src/internal/interactions.ts
function block(e) {
  e.preventDefault();
}
function chain(a, b) {
  return a ? function(e) {
    a(e);
    if (!e.defaultPrevented) b(e);
  } : b;
}
function both(a, b) {
  return a ? function(e) {
    a(e);
    b(e);
  } : b;
}
function inactive(el) {
  return el.disabled || el.getAttribute("aria-disabled") === "true" || el.classList.contains("dk-btn--link");
}
function reducedMotion() {
  return !!(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}
function pressKey(e) {
  const el = e.currentTarget;
  if ((e.key === "Enter" || e.key === " ") && !e.repeat && !inactive(el)) el.setAttribute("data-pressed", "");
}
function releaseKey(e) {
  e.currentTarget.removeAttribute("data-pressed");
}
function ripple(e) {
  const el = e.currentTarget;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (inactive(el) || reducedMotion()) return;
  const pre = el.classList.contains("dk-badge") ? "badge" : "btn";
  const host = el.querySelector(".dk-" + pre + "__ripples");
  if (!host || parseFloat(getComputedStyle(el).getPropertyValue(pre === "badge" ? "--badge-ripple-opacity" : "--button-ripple-opacity")) === 0) return;
  const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const d = 2 * Math.sqrt(Math.pow(Math.max(x, r.width - x), 2) + Math.pow(Math.max(y, r.height - y), 2));
  const dot = document.createElement("span");
  dot.className = "dk-" + pre + "__ripple";
  dot.style.width = dot.style.height = d + "px";
  dot.style.left = x - d / 2 + "px";
  dot.style.top = y - d / 2 + "px";
  host.appendChild(dot);
  const started = Date.now(), spread = parseFloat(getComputedStyle(dot).animationDuration) * 1e3 || 0;
  function remove() {
    if (dot.parentNode) dot.parentNode.removeChild(dot);
  }
  function release() {
    document.removeEventListener("pointerup", release, true);
    document.removeEventListener("pointercancel", release, true);
    setTimeout(function() {
      dot.addEventListener("transitionend", remove);
      dot.className += " dk-" + pre + "__ripple--out";
      setTimeout(remove, 2e3);
    }, Math.max(0, started + spread - Date.now()));
  }
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
}
export {
  block,
  both,
  chain,
  pressKey,
  releaseKey,
  ripple
};
//# sourceMappingURL=interactions.js.map
