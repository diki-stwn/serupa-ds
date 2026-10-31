import * as React from "react";

/* Custom inputs submit through a hidden input whose value comes from React state, and form.reset() (or React 19
   resetting a form after its action) doesn't touch state: the form kept submitting and showing the old choice.
   This runs reset (put the default back) when the form el is in resets. Only for uncontrolled use: a controlled
   value belongs to the app, as with a native input. formId: the form attribute of a control that isn't an input
   (a div with hidden inputs), naming a form it sits outside of. */
export function useFormReset(el: React.RefObject<HTMLElement | null>, reset: () => void, formId?: string): void {
  const run = React.useRef(reset);
  run.current = reset;
  React.useEffect(() => {
    const node = el.current;
    const named = formId ? document.getElementById(formId) : null;
    // Last, a group (a div) outside any form whose controls name one with their form attribute: RadioGroup and
    // CheckboxGroup kept the old choice when that form reset (L8E54).
    const inner = node && node.querySelector<HTMLInputElement>("input[form], select[form], textarea[form]");
    const form = node && ((named instanceof HTMLFormElement ? named : null) || (node as HTMLInputElement).form || node.closest("form") || (inner && inner.form));
    if (!form) return;
    // The browser resets the fields right after this event; the state update renders after that, so it wins.
    const on = () => run.current();
    form.addEventListener("reset", on);
    return () => form.removeEventListener("reset", on);
  }, [el, formId]);
}
