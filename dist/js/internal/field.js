"use client";

// src/internal/field.ts
import * as React from "react";
var FieldContext = /* @__PURE__ */ React.createContext(null);
function useFieldControl(props) {
  const f = React.useContext(FieldContext);
  if (!f) return props;
  const ids = [...new Set([props["aria-describedby"], f.describedBy].join(" ").split(/\s+/).filter(Boolean))].join(" ");
  return {
    ...props,
    id: props.id || f.id,
    "aria-describedby": ids || void 0,
    "aria-errormessage": props["aria-errormessage"] ?? f.errorMessage,
    "aria-required": props["aria-required"] ?? (f.required || void 0),
    invalid: props.invalid || f.invalid || void 0,
    disabled: props.disabled ?? (f.disabled || void 0)
  };
}
export {
  FieldContext,
  useFieldControl
};
//# sourceMappingURL=field.js.map
