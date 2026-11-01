import { byId } from "./root";

/* The name a field's own label gives it (aria-labelledby, aria-label or its <label>), for a button that acts on
   the field: "Clear Country". Text hidden from screen readers (Field's *) and Field's "(optional)" are left out.
   "" when the field has no label. */
export function fieldName(el: HTMLInputElement | null): string {
  if (!el) return "";
  const read = (n: Element | null) => {
    if (!n) return "";
    const copy = n.cloneNode(true) as Element;
    copy.querySelectorAll("[aria-hidden=true], .dk-field__optional").forEach((x) => x.remove());
    return copy.textContent || "";
  };
  const by = el.getAttribute("aria-labelledby");
  const text = by ? by.split(/\s+/).map((id) => read(byId(el, id))).join(" ")
    : el.getAttribute("aria-label") || read(el.labels && el.labels[0]);
  return text.replace(/\s+/g, " ").trim();
}
