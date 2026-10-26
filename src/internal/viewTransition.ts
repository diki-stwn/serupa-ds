"use client";
import { flushSync } from "react-dom";

// Smooth layout changes (FLIP) with the browser's View Transitions: the page is captured before and after `update`,
// and everything with a view-transition-name glides from where it was to where it is, resizing as it goes, while
// the rest crossfades. Timing comes from base.css (motion-change-md with ease-move), and under reduced motion
// nothing travels: the old and new states only crossfade. Where View Transitions are missing the update just
// happens, which is still correct.

/** Runs `update` (a state change, a DOM change) as a View Transition, so what it moves glides to its new place instead of
 *  jumping: a list reordered or filtered, a card expanded, a layout switched. Give each element that should travel a
 *  `view-transition-name` (or the `view-transition-match` utility class). React state set inside `update` is flushed
 *  synchronously, so the new layout is in place when the browser takes its "after" picture. `types` are View Transition
 *  types for your own `:active-view-transition-type()` styles. Resolves when the transition has finished (at once
 *  without one). */
export function withViewTransition(update: () => void, options: { types?: string[] } = {}): Promise<void> {
  const run = () => flushSync(update);
  if (typeof document === "undefined" || !("startViewTransition" in document)) { run(); return Promise.resolve(); }
  let t: ViewTransition;
  try { t = document.startViewTransition(options.types ? { update: run, types: options.types } : run); }
  catch { t = document.startViewTransition(run); }   // a browser with View Transitions but not yet their types
  return t.finished.catch(() => {});
}
