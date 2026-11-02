// src/internal/typeahead.ts
import { fold } from "./fold.js";
var TYPEAHEAD_PAUSE = 500;
function typing(typed, now = Date.now()) {
  return typed.text !== "" && now - typed.at <= TYPEAHEAD_PAUSE;
}
function typeahead(typed, key, labels, current, now = Date.now()) {
  const k = fold(key);
  typed.text = (now - typed.at > TYPEAHEAD_PAUSE ? "" : typed.text) + k;
  typed.at = now;
  const n = labels.length;
  const find = (word, from) => {
    for (let s = 0; s < n; s++) {
      const i2 = (from + s + n) % n;
      if (fold(labels[i2].trim()).startsWith(word)) return i2;
    }
    return -1;
  };
  const same = [...typed.text].every((c) => c === k);
  let i = same ? find(k, current + 1) : find(typed.text, Math.max(current, 0));
  if (i < 0 && !same) {
    typed.text = k;
    i = find(k, current + 1);
  }
  return i;
}
export {
  TYPEAHEAD_PAUSE,
  typeahead,
  typing
};
//# sourceMappingURL=typeahead.js.map
