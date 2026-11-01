/* Content that is hidden="until-found" (a closed AccordionItem, a kept Tab panel) can't take focus, so when a field in
   it fails the form's check on submit, the browser stops the submit and shows nothing: there's nothing to point at
   (L8E99). revealInvalid, an "invalid" listener (capture) on that content, does for the form's first invalid field
   what find-in-page does: fires beforematch, which opens the item or selects the tab, shows the content, then
   focuses the field and has the browser say what's wrong. */
export function revealInvalid(e: Event): void {
  const t = e.target as HTMLInputElement, f = t.form;
  const first = f ? Array.from(f.elements).find((x) => (x as HTMLInputElement).willValidate && !(x as HTMLInputElement).validity.valid) : t;
  let hid = 0;
  if (first === t) for (let h; (h = t.closest("[hidden=until-found]")); hid = 1) { h.dispatchEvent(new Event("beforematch")); h.removeAttribute("hidden"); }
  // The item opens on React's next render, which may come a frame or two later: focus as soon as the field takes it.
  let n = 0;
  const go = () => { t.focus(); if (t.ownerDocument.activeElement !== t && n++ < 10) requestAnimationFrame(go); else t.reportValidity(); };
  if (hid) requestAnimationFrame(go);
}
