// Switching theme changes every control's colors at once; with their own transitions (150ms on background, color
// and borders) each one would fade on its own while the page surface switches at once, so the page changes color
// unevenly. This finishes the color transitions the change starts, so the new colors arrive at once, and leaves
// motion running: a menu that fades out as "Dark" is picked, or a switch that slides as it turns dark mode on.
const COLOR = /color|shadow|fill|stroke/;

/** Runs `change` (such as setting data-theme on a section) and finishes the color transitions it starts in `element` and
 *  everything inside it, so the new theme's colors arrive at once instead of fading control by control. Motion (opacity,
 *  scale, translate) runs on. theme.js does this for the page. */
export function withoutColorTransitions(change: () => void, element?: HTMLElement): void {
  change();
  const el = element || (typeof document !== "undefined" ? document.documentElement : null);
  if (!el || !el.getAnimations) return;
  for (const a of el.getAnimations({ subtree: true })) if (a instanceof CSSTransition && COLOR.test(a.transitionProperty)) a.finish();
}
