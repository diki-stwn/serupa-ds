// src/internal/fold.ts
var LETTERS = { "\u0142": "l", "\u0111": "d", "\xF0": "d", "\xF8": "o", "\xE6": "ae", "\u0153": "oe", "\xDF": "ss", "\u0127": "h", "\u0131": "i", "\xFE": "th", "\u0167": "t", "\u014B": "n", "\u0138": "k", "\u03C2": "\u03C3" };
var ACCENTS = /[\u0300-\u036f]|[\u1ab0-\u1aff]|[\u1dc0-\u1dff]|[\u20d0-\u20ff]|[\ufe20-\ufe2f]|[\u0591-\u05c7]|[\u0610-\u061a]|[\u064b-\u065f]|[\u0670]|[\u06d6-\u06ed]/g;
var CYRILLIC = /[иИуУ]\u0306|[іІ]\u0308/g;
function fold(s) {
  return s.normalize("NFKD").replace(CYRILLIC, (m) => m.normalize("NFC")).replace(ACCENTS, "").toLowerCase().replace(/[łđðøæœßħıþŧŋĸς]/g, (c) => LETTERS[c]).replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 96));
}
export {
  fold
};
//# sourceMappingURL=fold.js.map
