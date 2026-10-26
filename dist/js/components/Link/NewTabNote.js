"use client";

// src/components/Link/NewTabNote.tsx
import * as React from "react";
import { useSerupa } from "../../internal/provider.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
function NewTabNote() {
  return /* @__PURE__ */ React.createElement(VisuallyHidden, null, " ", useSerupa().labels.opensInNewTab);
}
export {
  NewTabNote
};
//# sourceMappingURL=NewTabNote.js.map
