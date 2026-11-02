// src/internal/rejectInput.ts
import { announce } from "./announce.js";
function reject(text, reason, onInvalidInput, say) {
  const t = text.trim();
  if (onInvalidInput) onInvalidInput(t, reason);
  announce(say(t), { assertive: true });
}
export {
  reject
};
//# sourceMappingURL=rejectInput.js.map
