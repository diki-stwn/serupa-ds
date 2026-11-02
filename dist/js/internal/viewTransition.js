"use client";

// src/internal/viewTransition.ts
import { flushSync } from "react-dom";
function withViewTransition(update, options = {}) {
  const run = () => flushSync(update);
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    run();
    return Promise.resolve();
  }
  let t;
  try {
    t = document.startViewTransition(options.types ? { update: run, types: options.types } : run);
  } catch {
    t = document.startViewTransition(run);
  }
  return t.finished.catch(() => {
  });
}
export {
  withViewTransition
};
//# sourceMappingURL=viewTransition.js.map
