// src/components/Icon/asIcon.tsx
import * as React from "react";
import { isIconData } from "../../icons.js";
import { Icon } from "./Icon.js";
function asIcon(node) {
  if (typeof node === "string") return /* @__PURE__ */ React.createElement(Icon, { name: node });
  if (isIconData(node)) return /* @__PURE__ */ React.createElement(Icon, { icon: node });
  return node;
}
export {
  asIcon
};
//# sourceMappingURL=asIcon.js.map
