import * as React from "react";
import { spinnerMinShown } from "./timing";

/* Delay, then minimum (EB1): true once `on` has lasted `delay` ms, then for at least spinnerMinShown ms even if `on` ends
   sooner. A wait shorter than the delay shows nothing; a longer one never flickers on for a frame or two. Turning
   on again while the minimum runs out keeps it shown. Loader uses it; Button and Badge are next. */
export function useShowAfter(on: boolean, delay: number): boolean {
  const [shown, setShown] = React.useState(on && delay <= 0);
  const [shownAt] = React.useState(() => (shown ? Date.now() : 0));
  const since = React.useRef(shownAt);
  React.useEffect(function () {
    if (on === shown) return;
    const show = function () { since.current = Date.now(); setShown(true); };
    if (on && delay <= 0) { show(); return; }
    const t = on ? setTimeout(show, delay) : setTimeout(function () { setShown(false); }, Math.max(0, since.current + spinnerMinShown - Date.now()));
    return function () { clearTimeout(t); };
  }, [on, shown, delay]);
  // With no delay it shows in the same render that turns it on, not one frame later.
  return shown || (on && delay <= 0);
}
