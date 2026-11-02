"use client";

// src/components/Link/NewTabNote.tsx
import * as React from "react";
import { useSettings } from "../../internal/provider.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
import { en as words } from "./labels.js";
function NewTabNote() {
  return /* @__PURE__ */ React.createElement(VisuallyHidden, null, " ", useSettings(words).labels.opensInNewTab);
}
export {
  NewTabNote
};
//# sourceMappingURL=NewTabNote.js.map
