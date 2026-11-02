// src/internal/showAfter.ts
import * as React from "react";
import { spinnerMinShown } from "./timing.js";
function useShowAfter(on, delay) {
  const [shown, setShown] = React.useState(on && delay <= 0);
  const [shownAt] = React.useState(() => shown ? Date.now() : 0);
  const since = React.useRef(shownAt);
  React.useEffect(function() {
    if (on === shown) return;
    const show = function() {
      since.current = Date.now();
      setShown(true);
    };
    if (on && delay <= 0) {
      show();
      return;
    }
    const t = on ? setTimeout(show, delay) : setTimeout(function() {
      setShown(false);
    }, Math.max(0, since.current + spinnerMinShown - Date.now()));
    return function() {
      clearTimeout(t);
    };
  }, [on, shown, delay]);
  return shown || on && delay <= 0;
}
export {
  useShowAfter
};
//# sourceMappingURL=showAfter.js.map
