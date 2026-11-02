// src/internal/fieldName.ts
import { byId } from "./root.js";
function fieldName(el) {
  if (!el) return "";
  const read = (n) => {
    if (!n) return "";
    const copy = n.cloneNode(true);
    copy.querySelectorAll("[aria-hidden=true], .dk-field__optional").forEach((x) => x.remove());
    return copy.textContent || "";
  };
  const by = el.getAttribute("aria-labelledby");
  const text = by ? by.split(/\s+/).map((id) => read(byId(el, id))).join(" ") : el.getAttribute("aria-label") || read(el.labels && el.labels[0]);
  return text.replace(/\s+/g, " ").trim();
}
export {
  fieldName
};
//# sourceMappingURL=fieldName.js.map
