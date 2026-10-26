import * as React from "react";

/* Field names its control with <label for>, which only reaches native inputs. A control drawn another way (Slider's
   role="slider" thumbs, SegmentedControl's radiogroup, FileUpload's button) reads Field's label id here and names
   itself with aria-labelledby. Only the control Field wraps gets it: the one whose id Field set or read. */
export const FieldLabel = /* @__PURE__ */ React.createContext<{ control: string; label: string } | null>(null);

/** The id of the Field label for the control with this id, or undefined outside a Field (or for another element). */
export function useFieldLabel(id: string | undefined): string | undefined {
  const f = React.useContext(FieldLabel);
  return f && id && f.control === id ? f.label : undefined;
}
