// src/internal/useExit.ts
import * as React from "react";
import { useIsoLayoutEffect } from "./cn.js";
import { lastInputKeyboard, listenForInput } from "./lastInput.js";
function useExit(open, layer) {
  const [leaving, setLeaving] = React.useState(false), [was, setWas] = React.useState(open), [byKey, setByKey] = React.useState(false);
  if (was !== open) {
    const k = lastInputKeyboard();
    setWas(open);
    setByKey(k);
    setLeaving(!open && !k);
  }
  const arrived = React.useRef(open);
  if (!open) arrived.current = false;
  useIsoLayoutEffect(listenForInput, []);
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
  return { leaving, arrived: arrived.current, instant: arrived.current || byKey };
}
export {
  useExit
};
//# sourceMappingURL=useExit.js.map
