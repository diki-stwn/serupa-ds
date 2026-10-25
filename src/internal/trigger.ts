import * as React from "react";
import { warnOnce } from "./warn";

/* The trigger contract (G9): Popover, Menu, ContextMenu and Tooltip clone the one element they're given, adding a
   ref, ARIA and handlers. A text, several elements or a Fragment can't take them, and React.Children.only's own error
   ("expected to receive a single React element child") doesn't say which component or what to pass. */
/** The one element in node, or a clear error naming who needs it. */
export function oneElement<P>(node: React.ReactNode, who: string, where: string): React.ReactElement<P> {
  if (React.isValidElement(node) && node.type !== React.Fragment) return node as React.ReactElement<P>;
  throw new Error(`Serupa: ${who} needs one element as its ${where}, such as <Button> (not a text, a list or a Fragment).`);
}

/** Warns once when the trigger never handed its element to the ref: a component that doesn't forward its ref, so the
 *  panel can't be placed next to it or give focus back to it. */
export function useTriggerRef(ref: React.RefObject<HTMLElement | null>, who: string): void {
  React.useEffect(function () {
    if (process.env.NODE_ENV !== "production" && !ref.current) warnOnce("ref" + who, `Serupa: ${who}'s trigger doesn't forward its ref to an element.`);
  }, [ref, who]);
}
