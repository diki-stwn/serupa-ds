// src/internal/useFormReset.ts
import * as React from "react";
function useFormReset(el, reset, formId) {
  const run = React.useRef(reset);
  run.current = reset;
  React.useEffect(() => {
    const node = el.current;
    const named = formId ? document.getElementById(formId) : null;
    const inner = node && node.querySelector("input[form], select[form], textarea[form]");
    const form = node && ((named instanceof HTMLFormElement ? named : null) || node.form || node.closest("form") || inner && inner.form);
    if (!form) return;
    const on = () => run.current();
    form.addEventListener("reset", on);
    return () => form.removeEventListener("reset", on);
  }, [el, formId]);
}
export {
  useFormReset
};
//# sourceMappingURL=useFormReset.js.map
