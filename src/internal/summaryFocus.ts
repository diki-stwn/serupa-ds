/* An ErrorSummary that takes focus is read in full, so the Fields in its form don't also say their new errors, which
   would read the same list again straight after (GR54). The summary marks its form as it takes focus; the mark lasts
   until the commit's effects have run (a microtask), and a Field's error effect in that commit stays quiet. */

// module state: only the element of the summary focused in this commit, cleared before any other task runs.
let quiet: Element | null = null;

/** Called by ErrorSummary as it takes focus: its form (or the page) is quiet for this commit. */
export function summaryTookFocus(box: Element): void {
  quiet = box.closest("form") || box.ownerDocument.body;
  queueMicrotask(() => { quiet = null; });
}

/** True when a summary around this element took focus in this commit, so its new error isn't said again. */
export const summarySaysIt = (el: Element | null): boolean => !!quiet && !!el && quiet.contains(el);
