// src/internal/trigger.ts
import * as React from "react";
import { warnOnce } from "./warn.js";
function oneElement(node, who, where) {
  if (React.isValidElement(node) && node.type !== React.Fragment) return node;
  throw new Error(`Serupa: ${who} needs one element as its ${where}, such as <Button> (not a text, a list or a Fragment).`);
}
function useTriggerRef(ref, who) {
  React.useEffect(function() {
    if (process.env.NODE_ENV !== "production" && !ref.current) warnOnce("trigger-ref", `Serupa: ${who}'s trigger doesn't forward its ref to an element.`, "ref" + who);
  }, [ref, who]);
}
export {
  oneElement,
  useTriggerRef
};
//# sourceMappingURL=trigger.js.map
