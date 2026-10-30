// src/internal/useExit.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
function useExit(open, layer) {
  const [leaving, setLeaving] = React.useState(false), [was, setWas] = React.useState(open);
  if (was !== open) {
    setWas(open);
    setLeaving(!open);
  }
  const arrived = React.useRef(open);
  if (!open) arrived.current = false;
  useIsoLayoutEffect(() => {
    const p = layer.current;
    if (!leaving || !p) return;
    const runs = typeof p.getAnimations === "function" ? p.getAnimations() : [];
    if (!runs.length) {
      setLeaving(false);
      return;
    }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {
    }))).then(() => {
      if (on) setLeaving(false);
    });
    return () => {
      on = false;
    };
  }, [leaving, layer]);
  return { leaving, arrived: arrived.current };
}
export {
  useExit
};
//# sourceMappingURL=useExit.js.map
