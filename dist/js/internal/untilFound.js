// src/internal/untilFound.ts
function revealInvalid(e) {
  const t = e.target, f = t.form;
  const first = f ? Array.from(f.elements).find((x) => x.willValidate && !x.validity.valid) : t;
  let hid = 0;
  if (first === t) for (let h; h = t.closest("[hidden=until-found]"); hid = 1) {
    h.dispatchEvent(new Event("beforematch"));
    h.removeAttribute("hidden");
  }
  let n = 0;
  const go = () => {
    t.focus();
    if (t.ownerDocument.activeElement !== t && n++ < 10) requestAnimationFrame(go);
    else t.reportValidity();
  };
  if (hid) requestAnimationFrame(go);
}
export {
  revealInvalid
};
//# sourceMappingURL=untilFound.js.map
