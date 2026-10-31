// module state: whether the last input was a key rather than a pointer, which a layer reads as it opens or closes and
// an indicator as it moves (KW1). Only a browser sets it, from listeners on its own document added when the first
// component that asks mounts, so a server render always reads false and no request sees another's keys.
let keyed = false, listening = false;

/** Starts noting the last input, once for the page. Call it from a layout effect when the component mounts. */
export function listenForInput(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("keydown", () => { keyed = true; }, true);
  document.addEventListener("pointerdown", () => { keyed = false; }, true);
  // A click with no presses (detail 0) came from a key or a screen reader, as Enter on a button does.
  document.addEventListener("click", (e) => { keyed = e.detail === 0; }, true);
}

/** Whether the last input was a key (or a click a key or screen reader made), not a pointer or a touch. */
export function lastInputKeyboard(): boolean { return keyed; }
