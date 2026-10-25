// src/internal/graphemes.ts
var seg;
var segmenter = () => seg === void 0 ? seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null : seg;
function graphemes(text) {
  const s = segmenter();
  return s ? Array.from(s.segment(text), (x) => x.segment) : Array.from(text);
}
function graphemeCount(text) {
  const s = segmenter();
  if (!s) return Array.from(text).length;
  let n = 0;
  for (const _ of s.segment(text)) n++;
  return n;
}
function limitEdit(before, after, max) {
  const total = graphemeCount(after);
  if (total <= max || total <= graphemeCount(before)) return null;
  const a = graphemes(before), b = graphemes(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  const head = b.slice(0, start), added = b.slice(start, b.length - end), tail = b.slice(b.length - end);
  const keep = Math.max(0, max - head.length - tail.length);
  const kept = head.join("") + added.slice(0, keep).join("");
  return { value: kept + tail.join(""), caret: kept.length };
}
export {
  graphemeCount,
  graphemes,
  limitEdit
};
//# sourceMappingURL=graphemes.js.map
