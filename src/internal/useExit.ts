import * as React from "react";
import { useIsoLayoutEffect } from "./cn";

/** For a layer that fades out (DZ1): `leaving` stays true after `open` turns false until the layer's transitions
 *  end, or turns false at once where none run (no overlay support), so its content can stay while it fades rather
 *  than fade an empty box. `arrived` is true while it has been open since the first render: give it data-instant,
 *  which leaves out its starting style, so one open on arrival is there from the first frame. */
export function useExit(open: boolean, layer: React.RefObject<HTMLElement | null>): { leaving: boolean; arrived: boolean } {
  const [leaving, setLeaving] = React.useState(false), [was, setWas] = React.useState(open);
  if (was !== open) { setWas(open); setLeaving(!open); }
  const arrived = React.useRef(open); if (!open) arrived.current = false;
  useIsoLayoutEffect(() => {
    const p = layer.current;
    if (!leaving || !p) return;
    const runs = typeof p.getAnimations === "function" ? p.getAnimations() : [];
    if (!runs.length) { setLeaving(false); return; }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => { if (on) setLeaving(false); });
    return () => { on = false; };
  }, [leaving, layer]);
  return { leaving, arrived: arrived.current };
}
