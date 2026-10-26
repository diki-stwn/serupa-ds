// src/internal/fieldLabel.ts
import * as React from "react";
var FieldLabel = /* @__PURE__ */ React.createContext(null);
function useFieldLabel(id) {
  const f = React.useContext(FieldLabel);
  return f && id && f.control === id ? f.label : void 0;
}
export {
  FieldLabel,
  useFieldLabel
};
//# sourceMappingURL=fieldLabel.js.map
