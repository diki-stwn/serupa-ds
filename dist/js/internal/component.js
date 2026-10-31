// src/internal/component.ts
import * as React from "react";
function component(name, render) {
  const c = React.forwardRef(render);
  c.displayName = name;
  return c;
}
function named(name, c) {
  return Object.assign(c, { displayName: name });
}
export {
  component,
  named
};
//# sourceMappingURL=component.js.map
