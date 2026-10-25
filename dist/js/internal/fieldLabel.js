// src/internal/fieldLabel.ts
import * as React from "react";
var FieldLabel = React.createContext(null);
var FieldLabelProvider = FieldLabel.Provider;
function useFieldLabel(id) {
  const f = React.useContext(FieldLabel);
  return f && id && f.control === id ? f.label : void 0;
}
export {
  FieldLabelProvider,
  useFieldLabel
};
//# sourceMappingURL=fieldLabel.js.map
