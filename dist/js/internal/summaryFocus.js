// src/internal/summaryFocus.ts
var quiet = null;
function summaryTookFocus(box) {
  quiet = box.closest("form") || box.ownerDocument.body;
  queueMicrotask(() => {
    quiet = null;
  });
}
var summarySaysIt = (el) => !!quiet && !!el && quiet.contains(el);
export {
  summarySaysIt,
  summaryTookFocus
};
//# sourceMappingURL=summaryFocus.js.map
