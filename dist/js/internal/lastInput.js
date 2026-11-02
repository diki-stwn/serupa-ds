// src/internal/lastInput.ts
var keyed = false;
var listening = false;
function listenForInput() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("keydown", () => {
    keyed = true;
  }, true);
  document.addEventListener("pointerdown", () => {
    keyed = false;
  }, true);
  document.addEventListener("click", (e) => {
    keyed = e.detail === 0;
  }, true);
}
function lastInputKeyboard() {
  return keyed;
}
export {
  lastInputKeyboard,
  listenForInput
};
//# sourceMappingURL=lastInput.js.map
