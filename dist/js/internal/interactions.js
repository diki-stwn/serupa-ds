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
function pressKey(e) {
  const el = e.currentTarget;
  if ((e.key === "Enter" || e.key === " ") && !e.repeat && !inactive(el)) el.setAttribute("data-pressed", "");
}
function releaseKey(e) {
  e.currentTarget.removeAttribute("data-pressed");
}
export {
  block,
  both,
  chain,
  pressKey,
  releaseKey
};
//# sourceMappingURL=interactions.js.map
