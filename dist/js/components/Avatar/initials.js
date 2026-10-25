// src/components/Avatar/initials.ts
var segmenter;
function graphemes(s) {
  if (segmenter === void 0) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
  return segmenter ? Array.from(segmenter.segment(s), (g) => g.segment) : Array.from(s);
}
var INITIAL = /^[\p{L}\p{N}\p{Extended_Pictographic}]/u;
function initial(word) {
  const g = graphemes(word).find((c) => INITIAL.test(c));
  return g ? graphemes(g.toUpperCase())[0] : "";
}
function initials(name) {
  const found = (name || "").trim().split(/\s+/).map(initial).filter(Boolean);
  if (!found.length) return "";
  return found[0] + (found.length > 1 ? found[found.length - 1] : "");
}
export {
  initials
};
//# sourceMappingURL=initials.js.map
