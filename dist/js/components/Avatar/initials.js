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
  if (found.length === 1) return found[0];
  const first = found[0], last = found[found.length - 1];
  return first + (JOINING.test(first) && JOINING.test(last) ? "\u200C" : "") + last;
}
var JOINING = /^[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Nko}\p{Script=Mongolian}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Manichaean}\p{Script=Psalter_Pahlavi}\p{Script=Hanifi_Rohingya}\p{Script=Sogdian}]/u;
export {
  initials
};
//# sourceMappingURL=initials.js.map
