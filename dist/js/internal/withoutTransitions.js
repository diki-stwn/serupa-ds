// src/internal/withoutTransitions.ts
var COLOR = /color|shadow|fill|stroke/;
function withoutTransitions(change, element) {
  change();
  const el = element || (typeof document !== "undefined" ? document.documentElement : null);
  if (!el || !el.getAnimations) return;
  for (const a of el.getAnimations({ subtree: true })) if (a instanceof CSSTransition && COLOR.test(a.transitionProperty)) a.finish();
}
export {
  withoutTransitions
};
//# sourceMappingURL=withoutTransitions.js.map
