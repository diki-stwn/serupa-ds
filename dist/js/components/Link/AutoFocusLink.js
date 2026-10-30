"use client";

// src/components/Link/AutoFocusLink.tsx
import * as React from "react";
import { setRef } from "../../internal/cn.js";
import { useAutoFocus } from "../../internal/focus.js";
function AutoFocusLink(props) {
  const node = React.useRef(null);
  useAutoFocus(true, () => node.current);
  return React.createElement(props.as, { ...props.attrs, ref: (n) => {
    node.current = n;
    setRef(props.linkRef, n);
  } }, props.children);
}
export {
  AutoFocusLink
};
//# sourceMappingURL=AutoFocusLink.js.map
