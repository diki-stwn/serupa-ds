// src/internal/children.ts
import * as React from "react";
function flattenChildren(children, prefix = "") {
  const out = [];
  for (const c of React.Children.toArray(children)) {
    if (React.isValidElement(c) && c.type === React.Fragment) out.push(...flattenChildren(c.props.children, prefix + String(c.key)));
    else if (prefix && React.isValidElement(c)) out.push(React.cloneElement(c, { key: prefix + String(c.key) }));
    else out.push(c);
  }
  return out;
}
export {
  flattenChildren
};
//# sourceMappingURL=children.js.map
