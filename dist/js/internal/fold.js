// src/internal/fold.ts
var LETTERS = { "\u0142": "l", "\u0111": "d", "\xF0": "d", "\xF8": "o", "\xE6": "ae", "\u0153": "oe", "\xDF": "ss", "\u0127": "h", "\u0131": "i", "\xFE": "th", "\u0167": "t", "\u014B": "n", "\u0138": "k" };
function fold(s) {
  return s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[łđðøæœßħıþŧŋĸ]/g, (c) => LETTERS[c]);
}
export {
  fold
};
//# sourceMappingURL=fold.js.map
