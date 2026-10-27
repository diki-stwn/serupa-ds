// src/internal/showAfter.ts
import * as React from "react";
var MIN_SHOWN = 500;
function useShowAfter(on, delay) {
  const [shown, setShown] = React.useState(on && delay <= 0);
  const since = React.useRef(shown ? Date.now() : 0);
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
    }, Math.max(0, since.current + MIN_SHOWN - Date.now()));
    return function() {
      clearTimeout(t);
    };
  }, [on, shown, delay]);
  return shown || on && delay <= 0;
}
export {
  MIN_SHOWN,
  useShowAfter
};
//# sourceMappingURL=showAfter.js.map
