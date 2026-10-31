import * as React from "react";
import { useIsoLayoutEffect } from "./cn";

// module state: whether the last input was a key rather than a pointer, which every layer reads as it opens or
// closes. Only a browser sets it, from listeners on its own document added when the first layer mounts, so a server
// render always reads false and no request sees another's keys.
let keyed = false, listening = false;
const listen = () => {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("keydown", () => { keyed = true; }, true);
  document.addEventListener("pointerdown", () => { keyed = false; }, true);
  // A click with no presses (detail 0) came from a key or a screen reader, as Enter on a button does.
  document.addEventListener("click", (e) => { keyed = e.detail === 0; }, true);
};

/** For a layer that fades out (DZ1): `leaving` stays true after `open` turns false until the layer's transitions
 *  end, or turns false at once where none run (no overlay support), so its content can stay while it fades rather
 *  than fade an empty box. `arrived` is true while it has been open since the first render: give it data-instant,
 *  which leaves out its starting style, so one open on arrival is there from the first frame.
 *  `instant` is `arrived`, or the last open or close came from the keyboard (KW1): a layer opened by Enter, Space
 *  or an arrow is there at once and one closed by Escape is gone at once, as a key is pressed many times a minute
 *  and motion only slows it down. A pointer or touch keeps the motion. Give data-instant from it instead of
 *  `arrived` where the layer opens from a key, and drop the exit transition under [hidden][data-instant]. */
export function useExit(open: boolean, layer: React.RefObject<HTMLElement | null>): { leaving: boolean; arrived: boolean; instant: boolean } {
  const [leaving, setLeaving] = React.useState(false), [was, setWas] = React.useState(open), [byKey, setByKey] = React.useState(false);
  if (was !== open) { setWas(open); setByKey(keyed); setLeaving(!open && !keyed); }
  const arrived = React.useRef(open); if (!open) arrived.current = false;
  useIsoLayoutEffect(listen, []);
  useIsoLayoutEffect(() => {
    const p = layer.current;
    if (!leaving || !p) return;
    const runs = typeof p.getAnimations === "function" ? p.getAnimations() : [];
    if (!runs.length) { setLeaving(false); return; }
    let on = true;
    void Promise.all(runs.map((a) => a.finished.catch(() => {}))).then(() => { if (on) setLeaving(false); });
    return () => { on = false; };
  }, [leaving, layer]);
  return { leaving, arrived: arrived.current, instant: arrived.current || byKey };
}
